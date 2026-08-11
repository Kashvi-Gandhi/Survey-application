const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const bankRoutes = require('./routes/bankRoutes');
const questionRoutes = require('./routes/questionRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/questions', questionRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'QuizPulse Backend Running 🚀' });
});

module.exports = app;