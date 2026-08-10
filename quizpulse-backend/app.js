const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Security & Utility Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'QuizPulse Backend is up and running! 🚀',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;