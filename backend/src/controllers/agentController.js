const { runAgentLoop } = require("../services/agentService");
const supabase = require("../services/supabaseClient");
const observe = require("../agent/observe"); // ✅ Import the working observe logic
const { getActiveGoal, startNewGoal } = require("../services/goalService");

const runAgent = async (req, res) => {
  const userId = req.userId; // from the verified login token
  const userQuery = (req.body.userQuery || "").trim();

  console.log(`🤖 Agent triggered for User: ${userId}`);

  try {
    const existingGoal = await getActiveGoal(userId);

    // A. No open goal: the user's message becomes the new goal, and the
    //    smart model writes its first tasks.
    if (!existingGoal && userQuery) {
      console.log(`✨ No active goal. Starting new goal: "${userQuery}"`);
      const { message } = await startNewGoal(userId, userQuery);
      return res.json({
        success: true,
        result: {
          decision: { type: "CREATE_TASKS", message },
          actionResult: { action: "GOAL_STARTED", message },
        },
      });
    }

    // B. Open goal: save the message as an instruction, then run the loop.
    if (userQuery) {
      console.log(`📝 Received User Command: "${userQuery}"`);
      const { error } = await supabase.from("agent_memory").insert([
        { user_id: userId, memory_type: "user_instruction", content: userQuery },
      ]);
      if (error) throw error;
    }

    const result = await runAgentLoop(userId, userQuery);
    res.json({ success: true, result });
  } catch (error) {
    console.error("Agent Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAgentState = async (req, res) => {
  const userId = req.userId; // from the verified login token

  try {
    // ✅ FIX: Use 'observe' to fetch state. 
    // This ensures the Dashboard sees EXACTLY what the Agent sees (Pending tasks linked by Goal ID).
    const state = await observe(userId);

    res.json({
      success: true,
      state: state
    });

  } catch (error) {
    console.error("State Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { runAgent, getAgentState };