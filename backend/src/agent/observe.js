// backend/src/agent/observe.js
const supabase = require("../services/supabaseClient");

async function observe(userId) {
  console.log(`\n🔍 OBSERVING STATE FOR USER: ${userId}`);
  
  try {
    // 1. Get Active Goal
    const { data: userGoal, error: goalError } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "in_progress"]) 
      .maybeSingle();

    if (goalError) console.error("❌ Goal Error:", goalError);

    // 2. Get Tasks (PENDING ONLY)
    let activeTasks = [];
    if (userGoal) {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("goal_id", userGoal.id)
        .eq("status", "pending")
        .order("priority", { ascending: false }); // High priority first
      
      activeTasks = tasks || [];
    }

    // 3. NEW: Get Upcoming Reminders
    const { data: reminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .gt("remind_at", new Date().toISOString()) // Only future reminders
      .order("remind_at", { ascending: true })
      .limit(5);

    // 4. Get Memory (Expanded for Context)
    // We fetch the last 5 interactions to understand "I can't do THIS"
    const { data: recentMemory } = await supabase
      .from("agent_memory")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    return {
      userGoal,
      activeTasks, 
      activeReminders: reminders || [], // <--- PASSING REMINDERS TO BRAIN
      recentMemory: recentMemory || [],
      meta: { 
        now: new Date().toISOString(), 
        readableDate: new Date().toDateString() // Helps AI understand "Saturday"
      }
    };

  } catch (err) {
    console.error("💥 CRITICAL OBSERVE ERROR:", err);
    return { userGoal: null, activeTasks: [], activeReminders: [], recentMemory: [] };
  }
}

module.exports = observe;