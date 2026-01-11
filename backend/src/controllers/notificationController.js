const supabase = require('../services/supabaseClient');
const { sendReminderEmail } = require('../services/emailService');

const triggerDailyReminders = async (req, res) => {
  console.log("🔔 Daily Reminder Triggered by n8n");

  try {
    // 1. Get Active Goals (Because we know Goals have 'user_id')
    const { data: activeGoals, error: goalsError } = await supabase
      .from('goals')
      .select('id, user_id')
      .in('status', ['active', 'in_progress']); // Only check active goals

    if (goalsError) throw goalsError;

    if (!activeGoals || activeGoals.length === 0) {
      return res.status(200).json({ success: true, message: "No active goals found." });
    }

    // 2. Create a list of goal IDs to query tasks
    const goalIds = activeGoals.map(g => g.id);

    // 3. Get Pending Tasks for these goals
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('title, goal_id')
      .in('goal_id', goalIds) // Only tasks for our active goals
      .eq('status', 'pending');

    if (tasksError) throw tasksError;

    // 4. Map Tasks to Users
    // We need to match: Task -> Goal -> User
    const userTasksMap = {};

    tasks.forEach(task => {
      // Find the goal this task belongs to
      const parentGoal = activeGoals.find(g => g.id === task.goal_id);
      if (parentGoal && parentGoal.user_id) {
        const userId = parentGoal.user_id;
        
        if (!userTasksMap[userId]) {
          userTasksMap[userId] = [];
        }
        userTasksMap[userId].push(task);
      }
    });

    let emailsSent = 0;

    // 5. Send Emails
    for (const userId of Object.keys(userTasksMap)) {
      const userTaskList = userTasksMap[userId];

      // Get User Email from Profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (profile && profile.email) {
        console.log(`Sending reminder to ${profile.email} for ${userTaskList.length} tasks...`);
        
        await sendReminderEmail(
          profile.email, 
          userTaskList.length, 
          userTaskList[0].title
        );
        
        emailsSent++;
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Checked ${activeGoals.length} goals. Sent ${emailsSent} emails.` 
    });

  } catch (err) {
    console.error("Notification Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { triggerDailyReminders };