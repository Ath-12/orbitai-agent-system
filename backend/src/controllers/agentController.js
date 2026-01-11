const { runAgentLoop } = require("../services/agentService");
const supabase = require("../services/supabaseClient");
const observe = require("../agent/observe"); // ✅ Import the working observe logic

const runAgent = async (req, res) => {
  const { userId, runType, userQuery } = req.body;

  console.log(`🤖 Agent triggered for User: ${userId}`);

  try {
    if (userQuery) {
      console.log(`📝 Received User Command: "${userQuery}"`);

      // 1. CHECK: Does the user already have an active goal?
      const { data: existingGoal } = await supabase
        .from("goals")
        .select("id")
        .eq("user_id", userId)
        .in("status", ["active", "in_progress"])
        .maybeSingle();

      if (!existingGoal) {
        // 🅰️ CASE A: NO GOAL -> Create one
        console.log("✨ No active goal found. Creating new goal...");
        const { error } = await supabase
          .from('goals')
          .insert([
            { 
              user_id: userId, 
              title: userQuery, 
              status: 'in_progress' 
            }
          ]);
        if (error) throw error;

      } else {
        // 🅱️ CASE B: GOAL EXISTS -> Treat input as instruction/feedback
        console.log("🗣️ Active goal exists. Adding input to memory...");
        const { error } = await supabase
          .from('agent_memory')
          .insert([
            {
              user_id: userId,
              memory_type: 'user_instruction', // Agent will read this
              content: userQuery
            }
          ]);
        if (error) throw error;
      }
    }

    // 2. RUN THE AGENT LOOP
    const result = await runAgentLoop(userId);
    res.json({ success: true, result });

  } catch (error) {
    console.error("Agent Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAgentState = async (req, res) => {
  const { userId } = req.params;

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