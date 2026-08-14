// const app = require('./app');
// // const { supabase } = require('./config/supabase');
// const { poolPromise } = require('./config/db');
// require('dotenv').config();

// const PORT = process.env.PORT || 5000;

// // Test DB Connection before starting server
// // async function testDbConnection() {
// //   try {
// //     const { data, error } = await supabase.from('role_master').select('*');
// //     if (error) {
// //       console.error('❌ Failed to connect to Supabase:', error.message);
// //     } else {
// //       console.log('✅ Connected to Supabase DB successfully!');
// //       console.log(`📋 Roles found in DB: ${data.length}`);
// //     }
// //   } catch (err) {
// //     console.error('❌ Unexpected DB connection error:', err.message);
// //   }
// // }


// poolPromise
//   .then(() => {
//     console.log('✅ Connected to SQL Server successfully');
//   })
//   .catch((err) => {
//     console.error('❌ SQL Server connection failed:', err);
//   });

// app.listen(PORT, async () => {
//   console.log(`🚀 QuizPulse Server listening on port ${PORT}`);
//   await testDbConnection();
// });



const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import SQL Server pool
const { poolPromise } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const bankRoutes = require('./routes/bankRoutes');
const questionRoutes = require('./routes/questionRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('QuizPulse API is running...');
});

// Start Server & Test Database Connection
app.listen(PORT, async () => {
  console.log(`🚀 QuizPulse Server listening on port ${PORT}`);

  try {
    // Verify connection to SQL Server
    await poolPromise;
    console.log('✅ Connected to SQL Server successfully');
  } catch (err) {
    console.error('❌ Failed to connect to SQL Server:', err.message);
  }
});
