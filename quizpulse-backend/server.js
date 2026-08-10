const app = require('./app');
const { supabase } = require('./config/supabase');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Test DB Connection before starting server
async function testDbConnection() {
  try {
    const { data, error } = await supabase.from('role_master').select('*');
    if (error) {
      console.error('❌ Failed to connect to Supabase:', error.message);
    } else {
      console.log('✅ Connected to Supabase DB successfully!');
      console.log(`📋 Roles found in DB: ${data.length}`);
    }
  } catch (err) {
    console.error('❌ Unexpected DB connection error:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 QuizPulse Server listening on port ${PORT}`);
  await testDbConnection();
});