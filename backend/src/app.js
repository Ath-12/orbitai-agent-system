const express = require("express");
const cors = require("cors");

const agentRoutes = require("./routes/agentRoutes");
// 👇 1. Import the new route file here
const notificationRoutes = require("./routes/notificationRoutes"); 

const app = express();

app.use(cors());
app.use(express.json()); // 👈 Your routes must go BELOW this line

app.use("/tasks", require("./routes/taskRoutes"));
app.use("/goals", require("./routes/goalRoutes"));

// 👇 2. Add the new route here
// This creates: http://localhost:4000/notifications/daily-reminders
app.use("/notifications", notificationRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/agent", agentRoutes);

module.exports = app;