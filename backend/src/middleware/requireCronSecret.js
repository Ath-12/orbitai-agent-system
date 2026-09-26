// Protects endpoints that only the scheduler (n8n) should call.
// n8n must send the header:  x-cron-secret: <value of CRON_SECRET>
const crypto = require("crypto");

function requireCronSecret(req, res, next) {
  const expected = process.env.CRON_SECRET;
  const given = req.headers["x-cron-secret"];

  if (!expected || typeof given !== "string") {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  next();
}

module.exports = requireCronSecret;
