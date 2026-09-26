// backend/src/services/llm.js
// One place that talks to AI models, with automatic fallbacks.
//
//   tier "fast"  -> Groq gpt-oss-20b, then gpt-oss-120b, then Gemini
//   tier "smart" -> Groq gpt-oss-120b, then gpt-oss-20b, then Gemini
//
// Groq is the first choice. Gemini is only the last backup, used when Groq
// fails (rate limit, outage, missing key).
const { GoogleGenerativeAI } = require("@google/generative-ai");

// If the groq-sdk package is missing, skip Groq instead of crashing.
let Groq = null;
try {
  Groq = require("groq-sdk");
} catch {
  console.error("LLM: groq-sdk is not installed; run `npm install groq-sdk` in backend/");
}

const FAST_MODEL = process.env.GROQ_FAST_MODEL || "openai/gpt-oss-20b";
const SMART_MODEL = process.env.GROQ_SMART_MODEL || "openai/gpt-oss-120b";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

// Clients are created only if their key exists, so a missing key
// skips that provider instead of crashing the server at startup.
const groq = Groq && process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

function providerChain(tier) {
  const groqOrder = tier === "smart" ? [SMART_MODEL, FAST_MODEL] : [FAST_MODEL, SMART_MODEL];
  const chain = [];
  if (groq) groqOrder.forEach((model) => chain.push({ provider: "groq", model }));
  if (gemini) chain.push({ provider: "gemini", model: GEMINI_MODEL });
  return chain;
}

async function callGroq(model, system, user, schemaName, schema) {
  const response = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    // Strict mode: the model can only answer in exactly this JSON shape.
    response_format: {
      type: "json_schema",
      json_schema: { name: schemaName, strict: true, schema },
    },
  });
  return JSON.parse(response.choices[0].message.content);
}

async function callGemini(model, system, user, schema) {
  // Gemini's schema format differs from Groq's, so for this backup path we ask
  // for JSON, show it the schema in the prompt, and check the result ourselves.
  const m = gemini.getGenerativeModel({
    model,
    systemInstruction: system,
    generationConfig: { responseMimeType: "application/json" },
  });
  const prompt = `${user}\n\nReply with ONLY a JSON object that matches this JSON Schema:\n${JSON.stringify(schema)}`;
  const result = await m.generateContent(prompt);
  return JSON.parse(result.response.text());
}

/**
 * Ask a model for a JSON answer, trying providers in order until one works.
 * @param {object} opts
 * @param {"fast"|"smart"} opts.tier
 * @param {string} opts.system    rules for the model
 * @param {string} opts.user      the actual request
 * @param {string} opts.schemaName
 * @param {object} opts.schema    JSON Schema (Groq strict-mode style)
 * @param {(value: any) => boolean} opts.validate  extra check on the answer
 * @returns {Promise<{ value: any, model: string } | null>} null if every provider failed
 */
async function callJson({ tier, system, user, schemaName, schema, validate }) {
  const chain = providerChain(tier);
  if (chain.length === 0) {
    console.error("LLM: no AI provider configured (set GROQ_API_KEY and/or GEMINI_API_KEY)");
    return null;
  }

  for (const { provider, model } of chain) {
    try {
      const value =
        provider === "groq"
          ? await callGroq(model, system, user, schemaName, schema)
          : await callGemini(model, system, user, schema);

      if (validate && !validate(value)) {
        throw new Error("answer did not pass validation");
      }
      console.log(`🧠 LLM: ${provider}/${model} answered (${tier})`);
      return { value, model: `${provider}/${model}` };
    } catch (err) {
      console.error(`LLM Error (${provider}/${model}):`, err.status || "", err.message);
      // try the next one
    }
  }
  return null;
}

module.exports = { callJson };
