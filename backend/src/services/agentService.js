// ✅ Import your existing Agent logic
// (This assumes you have an index.js in src/agent exporting 'runAgent')
const { runAgent } = require("../agent");

/**
 * Service to handle the Agent execution loop.
 * This separates the "HTTP" part (Controller) from the "Logic" part (Service).
 */
const runAgentLoop = async (userId) => {
  console.log(`🔄 Service: Starting Agent Loop for ${userId}...`);
  
  try {
    // Call your existing agent logic
    // We pass "manual" because this is triggered by the UI button
    const result = await runAgent(userId, "manual");
    
    return result;
  } catch (error) {
    console.error("❌ Service Error in runAgentLoop:", error);
    throw error; // Pass error back to controller
  }
};

module.exports = { runAgentLoop };