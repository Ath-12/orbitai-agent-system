const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendReminderEmail = async (email, taskCount, firstTaskTitle) => {
  try {
    // NOTE: Until you verify a domain, you MUST use 'onboarding@resend.dev'
    // and you can ONLY send to the email you used to sign up for Resend.
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev', 
      to: email, 
      subject: `OrbitAI: You have ${taskCount} pending tasks`,
      html: `
        <h1>Time to get to work!</h1>
        <p>You have <strong>${taskCount}</strong> tasks waiting for you.</p>
        <p>Top priority: <b>${firstTaskTitle}</b></p>
        <p><a href="http://localhost:3000/dashboard">Go to Dashboard</a></p>
      `
    });
    return data;
  } catch (error) {
    console.error('Resend Error:', error);
    return null;
  }
};

module.exports = { sendReminderEmail };