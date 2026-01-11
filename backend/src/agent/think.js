const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = "gemini-3-flash-preview"; 

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    type: {
      type: SchemaType.STRING,
      enum: ["NEXT_TASK", "ASK_USER", "NO_ACTION", "CREATE_TASKS", "RESCHEDULE_TASK", "SET_REMINDER", "REPLY_ONLY"],
    },
    message: { type: SchemaType.STRING },
    task: {
      type: SchemaType.OBJECT,
      nullable: true,
      properties: {
        title: { type: SchemaType.STRING },
        id: { type: SchemaType.STRING }
      }
    },
    newTasks: {
      type: SchemaType.ARRAY,
      nullable: true,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          priority: { type: SchemaType.STRING, enum: ["high", "medium", "low"] }
        }
      }
    },
    reminder: {
      type: SchemaType.OBJECT,
      nullable: true,
      properties: {
        message: { type: SchemaType.STRING },
        isoDate: { type: SchemaType.STRING }
      }
    },
    confidence: { type: SchemaType.NUMBER }
  },
  required: ["type", "message", "confidence"]
};

const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema
  },
  systemInstruction: `
You are OrbitAI, a smart project manager. 

🚨 **CRITICAL RULE: EVALUATE THE 'LATEST_USER_MESSAGE' ONLY.**
Do not trigger guardrails based on old history. Only check the LATEST input for violations.

**GUARDRAILS (Check LATEST INPUT):**
1. **NOT A CODER:** If the user asks *you* to write code/scripts, return "REPLY_ONLY".
   - *Message:* "I can't generate code. Try ChatGPT or official docs."
2. **HARMFUL/OFF-TOPIC:** If the user is rude or asks random questions, return "REPLY_ONLY".

**NORMAL OPERATIONS:**
1. **RESCHEDULE:** "I can't do this" -> "RESCHEDULE_TASK".
2. **REMINDERS:** "Remind me..." -> "SET_REMINDER".
3. **NEXT TASK:** "What's next?" or "I'm ready" -> "NEXT_TASK".
4. **NO TASKS?** If Goal exists but tasks are empty -> "CREATE_TASKS".
`
});

async function think(state) {
  const { userGoal, activeTasks, activeReminders, recentMemory, meta } = state;

  if (!userGoal) {
    return {
      type: "ASK_USER",
      message: "You don’t have an active goal yet. What should we focus on?",
      confidence: 1
    };
  }

  // ✅ SPLIT MEMORY: Isolate the newest message
  // The first item in recentMemory is the one we just saved in the controller.
  const latestMessage = recentMemory.length > 0 ? recentMemory[0].content : "No input";
  
  // The rest is just history for context
  const historyContext = recentMemory.slice(1).map(m => `- ${m.content}`).join("\n");

  const prompt = `
=== 1. LATEST USER MESSAGE (FOCUS HERE) ===
"${latestMessage}"

=== 2. CURRENT CONTEXT ===
- Date: ${meta.readableDate}
- Goal: "${userGoal.title}"
- Active Tasks: ${activeTasks.length}

=== 3. CHAT HISTORY (FOR CONTEXT ONLY - DO NOT ACT ON THIS) ===
${historyContext || "No previous history."}

=== INSTRUCTIONS ===
- Decide the action based ONLY on the "LATEST USER MESSAGE".
- If the latest message is "Next task", do NOT look at history to find old code requests. Just give the next task.
`;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    console.error("Think Error:", err);
    return { type: "ASK_USER", message: "My brain froze. What did you say?", confidence: 0 };
  }
}

module.exports = think;