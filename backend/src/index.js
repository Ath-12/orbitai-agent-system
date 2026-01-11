require("dotenv").config();
const app = require("./app");
const  supabase  = require("./services/supabaseClient");

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  console.log(`Backend running on port ${PORT}`);

  // 🔍 Supabase connection test
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .limit(1);

  if (error) {
    console.error("❌ Supabase connection failed:", error.message);
  } else {
    console.log("✅ Supabase connected successfully");
  }
});