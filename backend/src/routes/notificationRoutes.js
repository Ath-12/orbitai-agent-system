const express = require('express');
const router = express.Router();
const { triggerDailyReminders } = require('../controllers/notificationController');

// Define the POST route
router.post('/daily-reminders', triggerDailyReminders);

module.exports = router;