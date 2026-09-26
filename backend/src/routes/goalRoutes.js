// backend/src/routes/goalRoutes.js
// Start a new goal, finish the current one, and list past goals.
const express = require("express");
const router = express.Router();
const requireUser = require("../middleware/requireUser");
const { startNewGoal, completeActiveGoal, getHistory } = require("../services/goalService");

/**
 * Start a new goal. The current open goal (if any) moves to history as "replaced".
 * body: { title: string }
 */
router.post("/", requireUser, async (req, res) => {
  const title = (req.body.title || "").trim();
  if (!title) {
    return res.status(400).json({ success: false, error: "Please type a goal first." });
  }
  if (title.length > 200) {
    return res.status(400).json({ success: false, error: "Keep the goal under 200 characters." });
  }
  try {
    const { goal, message } = await startNewGoal(req.userId, title);
    res.json({ success: true, goal, message });
  } catch (err) {
    console.error("New goal error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** Mark the current goal as completed and move it to history. */
router.post("/current/complete", requireUser, async (req, res) => {
  try {
    const goal = await completeActiveGoal(req.userId);
    if (!goal) {
      return res.status(404).json({ success: false, error: "There is no active goal to complete." });
    }
    res.json({ success: true, goal });
  } catch (err) {
    console.error("Complete goal error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** Past goals (completed or replaced), newest first. */
router.get("/history", requireUser, async (req, res) => {
  try {
    const history = await getHistory(req.userId);
    res.json({ success: true, history });
  } catch (err) {
    console.error("Goal history error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
