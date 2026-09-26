const express = require("express");
const router = express.Router();

// ✅ IMPORT FROM YOUR NEW CONTROLLER
// (This was pointing to the old '../agent' folder before)
const { runAgent, getAgentState } = require("../controllers/agentController");
const requireUser = require("../middleware/requireUser");

/**
 * Trigger agent run
 * body: { userId: string, runType?: "daily" | "manual", userQuery?: string }
 */
router.post("/run", requireUser, runAgent);

/**
 * Fetch current agent state
 * params: userId
 */
// The :userId in the URL is ignored; the id comes from the login token.
router.get("/state/:userId", requireUser, getAgentState);

module.exports = router;