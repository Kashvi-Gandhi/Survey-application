const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fail-safe check with readable error message
if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  console.error('❌ FATAL: Valid SUPABASE_URL missing in .env file!');
  console.error('Please add your actual Supabase URL from Project Settings -> API.');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('❌ FATAL: SUPABASE_ANON_KEY missing in .env file!');
  process.exit(1);
}

// Public client (respects Row Level Security)
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client (bypasses RLS when executing privileged server tasks)
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseKey
);

module.exports = { supabase, supabaseAdmin };