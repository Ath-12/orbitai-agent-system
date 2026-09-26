const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
// Must be the SERVICE ROLE (secret) key. The backend is the only thing allowed
// to read and write the tables once Row Level Security is enabled.
// SUPABASE_KEY is still accepted so an existing Render setup keeps working.
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in backend environment");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = supabase;
