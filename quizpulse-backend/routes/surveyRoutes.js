const express = require('express');
const router = express.Router();
const {
  debugResponses,
  getSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  addQuestionsFromBank,
  importSelectedQuestions,
  submitResponse,
  getSurveyAnalytics
} = require('../controllers/surveyController');
const authenticateUser = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Protected Routes (Surveyors / Admins)
router.get('/', authenticateUser, authorizeRoles('surveyor', 'admin'), getSurveys);
router.post('/', authenticateUser, authorizeRoles('surveyor', 'admin'), createSurvey);
router.put('/:id', authenticateUser, authorizeRoles('surveyor', 'admin'), updateSurvey);
router.delete('/:id', authenticateUser, authorizeRoles('surveyor', 'admin'), deleteSurvey);
router.post('/import-bank', authenticateUser, authorizeRoles('surveyor', 'admin'), addQuestionsFromBank);
router.post('/import-selected', authenticateUser, authorizeRoles('surveyor', 'admin'), importSelectedQuestions);
router.get('/:id/analytics', authenticateUser, authorizeRoles('surveyor', 'admin'), getSurveyAnalytics);

// Public / Accessible Routes
router.get('/debug/responses', debugResponses); // Debug endpoint
router.get('/:id', getSurveyById); // Public endpoint for taking surveys
router.post('/submit', submitResponse);

module.exports = router;
