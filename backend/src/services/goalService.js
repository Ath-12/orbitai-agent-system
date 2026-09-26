// backend/src/services/goalService.js
// Everything about a goal's life: finding the current one, starting a new one,
// ending one (completed or replaced), progress, and history.
//
// A goal is "open" while ended_at is empty. Each user has at most one open
// goal (the database enforces this with a unique index). Ended goals stay in
// the table and make up the history.
const supabase = require("./supabaseClient");
const { planTasks } = require("../agent/think");

const OPEN_STATUSES = ["active", "in_progress"];

async function getActiveGoal(userId) {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .in("status", OPEN_STATUSES)
    .is("ended_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getProgress(goalId) {
  const { data, error } = await supabase.from("tasks").select("status").eq("goal_id", goalId);
  if (error) throw error;
  const total = data.length;
  const done = data.filter((t) => t.status === "done").length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

async function endGoal(goalId, outcome) {
  const { error } = await supabase
    .from("goals")
    .update({ ended_at: new Date().toISOString(), outcome })
    .eq("id", goalId)
    .is("ended_at", null);
  if (error) throw error;
}

/**
 * Start a new goal. Any open goal is ended first and kept in history as "replaced".
 * Then the smart model writes the first tasks.
 */
async function startNewGoal(userId, title) {
  const current = await getActiveGoal(userId);
  if (current) {
    await endGoal(current.id, "replaced");
    await supabase.from("agent_memory").insert({
      user_id: userId,
      memory_type: "goal_replaced",
      content: `Moved goal to history: "${current.title}"`,
    });
  }

  const { data: goal, error } = await supabase
    .from("goals")
    .insert({ user_id: userId, title, status: "in_progress" })
    .select()
    .single();
  if (error) throw error;

  await supabase.from("agent_memory").insert({
    user_id: userId,
    memory_type: "goal_started",
    content: `Started a new goal: "${title}"`,
  });

  const plan = await planTasks({ goalTitle: title });
  if (!plan) {
    return {
      goal,
      message: `New goal set: "${title}". I couldn't write tasks just now; press Run Agent to try again.`,
    };
  }

  const { error: taskError } = await supabase.from("tasks").insert(
    plan.tasks.map((t) => ({ goal_id: goal.id, title: t.title, priority: t.priority, status: "pending" }))
  );
  if (taskError) throw taskError;

  await supabase.from("agent_memory").insert({
    user_id: userId,
    memory_type: "roadmap_update",
    content: `Created ${plan.tasks.length} tasks for "${title}".`,
  });

  return { goal, message: plan.message };
}

/** Mark the user's open goal as completed. Returns the goal, or null if there was none. */
async function completeActiveGoal(userId) {
  const goal = await getActiveGoal(userId);
  if (!goal) return null;
  await endGoal(goal.id, "completed");
  await supabase.from("agent_memory").insert({
    user_id: userId,
    memory_type: "goal_completed",
    content: `Completed goal: "${goal.title}"`,
  });
  return goal;
}

/** Ended goals, newest first, with how many tasks were done. */
async function getHistory(userId) {
  const { data: goals, error } = await supabase
    .from("goals")
    .select("id, title, outcome, created_at, ended_at")
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  if (goals.length === 0) return [];

  const { data: tasks, error: taskError } = await supabase
    .from("tasks")
    .select("goal_id, status")
    .in("goal_id", goals.map((g) => g.id));
  if (taskError) throw taskError;

  return goals.map((g) => {
    const own = tasks.filter((t) => t.goal_id === g.id);
    return { ...g, done: own.filter((t) => t.status === "done").length, total: own.length };
  });
}

module.exports = { getActiveGoal, getProgress, startNewGoal, completeActiveGoal, endGoal, getHistory };
