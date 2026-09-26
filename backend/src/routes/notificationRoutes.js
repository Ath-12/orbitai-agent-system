const express = require('express');
const router = express.Router();
const { triggerDailyReminders } = require('../controllers/notificationController');
const requireCronSecret = require('../middleware/requireCronSecret');

// Define the POST route
router.post('/daily-reminders', requireCronSecret, triggerDailyReminders);

module.exports = router;