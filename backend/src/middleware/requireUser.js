// Verifies the Supabase login token sent by the frontend.
// The user id is taken from the verified token, never from the request body,
// so nobody can act as another user by typing their id.
const supabase = require("../services/supabaseClient");

async function requireUser(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: "Not logged in" });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ success: false, error: "Invalid or expired session" });
  }

  req.userId = data.user.id;
  next();
}

module.exports = requireUser;
