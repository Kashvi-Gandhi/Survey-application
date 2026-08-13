const express = require('express');
const router = express.Router();
const {
  createSurvey,
  addQuestionsFromBank,
  submitResponse,
  getSurveyAnalytics
} = require('../controllers/surveyController');
const authenticateUser = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Protected Routes (Surveyors / Admins)
router.post('/', authenticateUser, authorizeRoles('surveyor', 'admin'), createSurvey);
router.post('/import-bank', authenticateUser, authorizeRoles('surveyor', 'admin'), addQuestionsFromBank);
router.get('/:id/analytics', authenticateUser, authorizeRoles('surveyor', 'admin'), getSurveyAnalytics);

// Public / Accessible Route for Submitting Answers
router.post('/submit', submitResponse);

module.exports = router;