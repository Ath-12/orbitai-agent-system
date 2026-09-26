// backend/src/agent/think.js
// The "Think" step.
//  1. A fast model (gpt-oss-20b) decides ONE action for this run.
//  2. If that action is "create tasks", a smart model (gpt-oss-120b) writes the
//     task list, because that is the part the user keeps and works from.
// Fallbacks for both steps are handled in services/llm.js.
const { callJson } = require("../services/llm");

const ACTION_TYPES = [
  "NEXT_TASK",
  "ASK_USER",
  "NO_ACTION",
  "CREATE_TASKS",
  "RESCHEDULE_TASK",
  "SET_REMINDER",
  "REPLY_ONLY",
];
const PRIORITIES = ["high", "medium", "low"];

// ---------- Step 1: decide the action (fast model) ----------

const decisionSchema = {
  type: "object",
  properties: {
    type: { type: "string", enum: ACTION_TYPES },
    message: { type: "string" },
    task: {
      type: ["object", "null"],
      properties: { title: { type: "string" }, id: { type: ["string", "null"] } },
      required: ["title", "id"],
      additionalProperties: false,
    },
    reminder: {
      type: ["object", "null"],
      properties: { message: { type: "string" }, isoDate: { type: "string" } },
      required: ["message", "isoDate"],
      additionalProperties: false,
    },
    confidence: { type: "number" },
  },
  required: ["type", "message", "task", "reminder", "confidence"],
  additionalProperties: false,
};

const DECIDE_SYSTEM = `
You are OrbitAI, a smart project manager. Choose exactly ONE action.

CRITICAL RULE: decide from the LATEST USER MESSAGE only. History is context, never a trigger.

GUARDRAILS (check the latest message):
1. If the user asks you to write code or scripts -> "REPLY_ONLY" with the message
   "I can't generate code. Try ChatGPT or official docs."
2. If the user is rude or off-topic -> "REPLY_ONLY".

ACTIONS:
- "I can't do this" / too hard / no time -> "RESCHEDULE_TASK".
- "Remind me..." -> "SET_REMINDER". Put an ISO 8601 date in reminder.isoDate.
- "What's next?" / "I'm ready" / no message -> "NEXT_TASK".
- The user asks for more tasks, or there are no active tasks -> "CREATE_TASKS".
  Do not write the tasks yourself; another step writes them.
- Unclear request -> "ASK_USER" with a short question.

Set task and reminder to null when the chosen action does not use them.
Keep "message" short and friendly: one or two sentences.
`;

function isValidDecision(d) {
  return d && ACTION_TYPES.includes(d.type) && typeof d.message === "string";
}

// ---------- Step 2: write the task list (smart model) ----------

const taskPlanSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          priority: { type: "string", enum: PRIORITIES },
        },
        required: ["title", "priority"],
        additionalProperties: false,
      },
    },
  },
  required: ["message", "tasks"],
  additionalProperties: false,
};

const PLAN_SYSTEM = `
You are OrbitAI, a practical coach who turns a goal into a short action plan.
Write 3 to 7 concrete tasks, each one finishable in a single sitting.
Start each title with a verb. Keep titles under 80 characters.
Order them in the sequence the user should do them.
Mark the first one or two as "high", foundational ones as "medium", optional ones as "low".
Do not repeat tasks that are already done or already in the list.
"message" is one or two encouraging sentences about the plan.
`;

function isValidPlan(p) {
  return (
    p &&
    Array.isArray(p.tasks) &&
    p.tasks.length > 0 &&
    p.tasks.every((t) => t && typeof t.title === "string" && PRIORITIES.includes(t.priority))
  );
}

/**
 * Write a task list for a goal. Used by the agent and when a new goal starts.
 * @returns {Promise<{ message: string, tasks: {title, priority}[] } | null>}
 */
async function planTasks({ goalTitle, existingTasks = [], request = "" }) {
  const user = `
Goal: "${goalTitle}"
Tasks already in the list or done: ${existingTasks.length ? existingTasks.map((t) => `"${t}"`).join(", ") : "none"}
User's request: ${request || "Create the first set of tasks for this goal."}
`;
  const result = await callJson({
    tier: "smart",
    system: PLAN_SYSTEM,
    user,
    schemaName: "task_plan",
    schema: taskPlanSchema,
    validate: isValidPlan,
  });
  if (!result) return null;
  // Keep the list short even if a model ignores the limit.
  return { message: result.value.message, tasks: result.value.tasks.slice(0, 7) };
}

// ---------- The Think step ----------

async function think(state, userQuery) {
  const { userGoal, activeTasks, recentMemory, meta } = state;

  // No goal yet: no need to spend a model call.
  if (!userGoal) {
    return {
      type: "ASK_USER",
      message: "You don’t have an active goal yet. What should we focus on?",
      confidence: 1,
    };
  }

  // The user's words for THIS run come straight from the request, so a
  // "Completed task" note in memory can never be mistaken for a new message.
  const latestMessage = userQuery && userQuery.trim() ? userQuery.trim() : "(no message - the user pressed Run Agent)";
  const historyContext = recentMemory.map((m) => `- ${m.content}`).join("\n");

  const user = `
=== LATEST USER MESSAGE (decide from this) ===
"${latestMessage}"

=== CURRENT CONTEXT ===
- Date: ${meta.readableDate} (now: ${meta.now})
- Goal: "${userGoal.title}"
- Active tasks (${activeTasks.length}): ${activeTasks.map((t) => `[${t.id}] ${t.title}`).join("; ") || "none"}

=== RECENT HISTORY (context only - do not act on it) ===
${historyContext || "No previous history."}
`;

  const result = await callJson({
    tier: "fast",
    system: DECIDE_SYSTEM,
    user,
    schemaName: "agent_decision",
    schema: decisionSchema,
    validate: isValidDecision,
  });

  if (!result) {
    return { type: "ASK_USER", message: "My brain froze. What did you say?", confidence: 0 };
  }

  const decision = result.value;

  // Creating tasks is the important part, so the smart model writes them.
  if (decision.type === "CREATE_TASKS") {
    const plan = await planTasks({
      goalTitle: userGoal.title,
      existingTasks: activeTasks.map((t) => t.title),
      request: userQuery,
    });
    if (!plan) {
      return { type: "ASK_USER", message: "I couldn't write the tasks just now. Please try again in a minute.", confidence: 0 };
    }
    decision.newTasks = plan.tasks;
    decision.message = plan.message;
  }

  return decision;
}

module.exports = think;
module.exports.planTasks = planTasks;
