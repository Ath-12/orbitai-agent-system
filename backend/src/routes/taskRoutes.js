const express = require("express");
const router = express.Router();

const supabaseClient = require("../services/supabaseClient");
const supabase = supabaseClient.supabase || supabaseClient;
const requireUser = require("../middleware/requireUser");
const { getProgress, endGoal } = require("../services/goalService");

/**
 * Complete a task
 * POST /tasks/:taskId/complete
 */
router.post("/:taskId/complete", requireUser, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.userId; // from the verified login token

    if (!taskId || !userId) {
      return res.status(400).json({ error: "taskId and userId are required" });
    }

    // ✅ Correct ownership check via goals
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        status,
        goal_id,
        goal:goals (
          id,
          title,
          user_id,
          ended_at
        )
      `)
      .eq("id", taskId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!task || task.goal.user_id !== userId) {
      return res.status(404).json({ error: "Task not found or unauthorized" });
    }

    if (task.status === "done") {
      return res.json({ success: true, message: "Task already completed." });
    }

    // ✅ Mark task as done
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ status: "done" })
      .eq("id", taskId);

    if (updateError) throw updateError;

    // ✅ Store memory
    await supabase.from("agent_memory").insert({
      user_id: userId,
      memory_type: "task_completed",
      content: `Completed task: "${task.title}"`,
      created_at: new Date().toISOString()
    });

    // ✅ If that was the last task, the goal is finished: move it to history.
    const progress = await getProgress(task.goal_id);
    let goalCompleted = false;
    if (progress.total > 0 && progress.done === progress.total && !task.goal.ended_at) {
      await endGoal(task.goal_id, "completed");
      await supabase.from("agent_memory").insert({
        user_id: userId,
        memory_type: "goal_completed",
        content: `Completed goal: "${task.goal.title}"`,
      });
      goalCompleted = true;
    }

    res.json({
      success: true,
      message: `Task "${task.title}" marked as complete.`,
      progress,
      goalCompleted,
    });

  } catch (err) {
    console.error("Task completion error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
