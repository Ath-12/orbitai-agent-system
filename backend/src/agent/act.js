// backend/src/agent/act.js
const supabase = require("../services/supabaseClient");

async function act(userId, decision) {
  try {
    console.log(`⚡ Act Phase: ${decision.type}`);
    
    // 1. Get Goal Context (Reusable)
    const { data: activeGoal } = await supabase
      .from("goals")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["active", "in_progress"])
      .maybeSingle();
// =========================================================
    // 🆕 CASE: REPLY ONLY (Guardrails)
    // =========================================================
    if (decision.type === "REPLY_ONLY") {
      console.log(`🛡️ Guardrail Triggered: ${decision.message}`);
      return {
        action: "REPLY",
        message: decision.message
      };
    }
    // =========================================================
    // 🆕 CASE: SET REMINDER
    // =========================================================
    if (decision.type === "SET_REMINDER" && decision.reminder) {
      console.log(`⏰ Setting Reminder: ${decision.reminder.message}`);

      const { error } = await supabase.from("reminders").insert({
        user_id: userId,
        message: decision.reminder.message,
        remind_at: decision.reminder.isoDate,
        status: "pending"
      });

      if (error) throw error;

      return {
        action: "SET_REMINDER",
        message: decision.message || `Done. I'll remind you to "${decision.reminder.message}" on that day.`
      };
    }

   // =========================================================
    // 🆕 CASE: RESCHEDULE + CREATE RECOVERY TASK
    // =========================================================
    if (decision.type === "RESCHEDULE_TASK") {
      // 1. Find the hard task
      let targetTaskId = decision.task?.id;

      if (!targetTaskId) {
        const { data: topTask } = await supabase
          .from("tasks")
          .select("id")
          .eq("goal_id", activeGoal.id)
          .eq("status", "pending")
          .order("priority", { ascending: false }) // Get the hardest one
          .limit(1)
          .single();
        if (topTask) targetTaskId = topTask.id;
      }

      if (targetTaskId) {
        console.log(`🗓️ Rescheduling Task ID: ${targetTaskId}`);
        
        // A. Move the hard task to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        await supabase
          .from("tasks")
          .update({ due_date: tomorrow.toISOString(), priority: "medium" }) 
          .eq("id", targetTaskId);

        // B. CREATE A NEW SIMPLE TASK (The Fix!)
        // We auto-generate a "Recovery Task" so the user feels productive but not stressed.
        const simpleTaskTitle = "Review today's progress (5 mins)";
        
        await supabase.from("tasks").insert({
          goal_id: activeGoal.id,
          title: simpleTaskTitle,
          priority: "low",
          status: "pending",
          due_date: new Date().toISOString() // Due today
        });

        return {
          action: "RESCHEDULED",
          // Update the message to tell the user what happened
          message: decision.message || `I moved the hard task to tomorrow. I added a simple "${simpleTaskTitle}" task to keep your streak alive!`
        };
      }
    }

    // =========================================================
    // 🅰️ CASE: CREATE TASKS
    // =========================================================
    if (decision.type === "CREATE_TASKS" && activeGoal) {
        // ... (Keep your existing CREATE_TASKS logic here) ...
        const newTasks = decision.newTasks || [];
        const tasksToInsert = newTasks.map(t => ({
           goal_id: activeGoal.id,
           title: t.title,
           priority: t.priority || "medium",
           status: "pending"
        }));
        await supabase.from("tasks").insert(tasksToInsert);
        return { action: "CREATED_TASKS", message: decision.message };
    }

    // =========================================================
    // 🅱️ CASE: RECOMMEND TASK
    // =========================================================
    if (decision.type === "NEXT_TASK" && activeGoal) {
       // ... (Keep your existing NEXT_TASK logic here) ...
       // I'm skipping pasting the whole block to save space, but KEEP IT!
       const { data: task } = await supabase
         .from("tasks")
         .select("*")
         .eq("goal_id", activeGoal.id)
         .eq("status", "pending")
         .order("priority", { ascending: false })
         .limit(1)
         .maybeSingle();

       if (task) {
         return {
           action: "RECOMMEND_TASK",
           task: task,
           message: decision.message || `Let's work on ${task.title}`
         };
       }
    }

    return { action: "NONE", message: decision.message };

  } catch (err) {
    console.error("Act Error:", err);
    return { action: "ERROR", message: "Something went wrong while acting." };
  }
}

module.exports = act;