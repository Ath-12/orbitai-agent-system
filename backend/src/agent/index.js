const observe = require("./observe");
const think = require("./think");
const act = require("./act");
const remember = require("./remember");

async function runAgent(userId, runType = "manual") {
  try {
    console.log(`\n🤖 Agent Active for User: ${userId}`);
    
    // 1. Observe
    const state = await observe(userId);
    
    // 2. Think
    const decision = await think(state);
    console.log(`💡 Decision: ${decision.type}`);

    // 3. Act
    const actionResult = await act(userId, decision);
    
    // 4. Remember
    await remember(userId, decision, actionResult, runType);

    return { decision, actionResult };

  } catch (error) {
    console.error("💥 Critical Agent Failure:", error);
    return { error: error.message };
  }
}

module.exports = { runAgent };