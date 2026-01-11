// backend/src/agent/remember.js
const supabase = require("../services/supabaseClient");

async function remember(userId, decision, actionResult, runType) {
  // 1. Basic Log
  const summary = {
    runType,
    decisionType: decision.type,
    message: decision.message,
    timestamp: new Date().toISOString()
  };
  
  await supabase.from("agent_runs").insert({ user_id: userId, summary });

  // 2. Intelligent Memory Stream
  let memoryContent = null;
  let memoryType = "agent_action";

  switch (decision.type) {
    case "SET_REMINDER":
      memoryContent = `Set reminder: "${decision.reminder?.message}" for ${decision.reminder?.isoDate}`;
      memoryType = "reminder_set";
      break;
    
    case "RESCHEDULE_TASK":
      memoryContent = `User deferred a task. Rescheduled to tomorrow.`;
      memoryType = "user_preference"; // Tagging this as preference helps "learn" the user is busy
      break;

    case "CREATE_TASKS":
      memoryContent = `Created new tasks for roadmap.`;
      memoryType = "roadmap_update";
      break;

    case "NEXT_TASK":
      if (decision.task) {
        memoryContent = `Suggested Task: ${decision.task.title}`;
        memoryType = "last_recommended_task";
      }
      break;
  }

  // 3. Save to Long-Term Memory
  if (memoryContent) {
    console.log(`🧠 Storing Memory: [${memoryType}] ${memoryContent}`);
    await supabase.from("agent_memory").insert({
      user_id: userId,
      memory_type: memoryType,
      content: memoryContent
    });
  }
}

module.exports = remember;