// backend/src/agent/observe.js
// The "Observe" step: collect everything the agent (and the dashboard) needs
// to know about the user right now.
const supabase = require("../services/supabaseClient");
const { getActiveGoal, getProgress } = require("../services/goalService");

async function observe(userId) {
  console.log(`\n🔍 OBSERVING STATE FOR USER: ${userId}`);

  try {
    // 1. The one open goal (newest, if old data ever has more than one)
    const userGoal = await getActiveGoal(userId);

    // 2. Pending tasks of that goal, and progress (done / total)
    let activeTasks = [];
    let progress = { done: 0, total: 0, percent: 0 };
    if (userGoal) {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("goal_id", userGoal.id)
        .eq("status", "pending");
      // Sort in code: sorting the text "high/medium/low" alphabetically puts
      // "medium" first, which is wrong.
      const rank = { high: 0, medium: 1, low: 2 };
      activeTasks = (tasks || []).sort((a, b) => (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3));
      progress = await getProgress(userGoal.id);
    }

    // 3. Upcoming reminders
    const { data: reminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .gt("remind_at", new Date().toISOString())
      .order("remind_at", { ascending: true })
      .limit(5);

    // 4. Recent memory. With a goal, only memory from this goal's lifetime,
    //    so notes about an old goal don't confuse the agent.
    let memoryQuery = supabase
      .from("agent_memory")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (userGoal?.created_at) memoryQuery = memoryQuery.gte("created_at", userGoal.created_at);
    const { data: recentMemory } = await memoryQuery;

    return {
      userGoal,
      activeTasks,
      progress,
      activeReminders: reminders || [],
      recentMemory: recentMemory || [],
      meta: {
        now: new Date().toISOString(),
        readableDate: new Date().toDateString(),
      },
    };
  } catch (err) {
    console.error("💥 CRITICAL OBSERVE ERROR:", err);
    return {
      userGoal: null,
      activeTasks: [],
      progress: { done: 0, total: 0, percent: 0 },
      activeReminders: [],
      recentMemory: [],
      meta: { now: new Date().toISOString(), readableDate: new Date().toDateString() },
    };
  }
}

module.exports = observe;
