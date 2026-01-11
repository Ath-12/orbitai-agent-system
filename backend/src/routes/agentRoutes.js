const express = require("express");
const router = express.Router();

// ✅ IMPORT FROM YOUR NEW CONTROLLER
// (This was pointing to the old '../agent' folder before)
const { runAgent, getAgentState } = require("../controllers/agentController");

/**
 * Trigger agent run
 * body: { userId: string, runType?: "daily" | "manual", userQuery?: string }
 */
router.post("/run", runAgent);

/**
 * Fetch current agent state
 * params: userId
 */
router.get("/state/:userId", getAgentState);

module.exports = router;