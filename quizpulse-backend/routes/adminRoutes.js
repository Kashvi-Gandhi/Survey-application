const express = require('express');
const { isAdmin } = require('../middleware/authMiddleware');
const {
  getMetrics,
  getAllSurveyors,
  toggleSurveyorStatus,
  getSystemSurveys,
  updateSystemSurveyStatus,
  updateSystemSurvey,
  getMasterQuestionBanks,
  createMasterQuestionBank,
  updateMasterQuestionBank,
  deleteMasterQuestionBank
} = require('../controllers/adminController');

const router = express.Router();

router.use(isAdmin);
router.get('/metrics', getMetrics);
router.get('/surveyors', getAllSurveyors);
router.patch('/surveyors/:id/status', toggleSurveyorStatus);
router.get('/surveys', getSystemSurveys);
router.patch('/surveys/:id/status', updateSystemSurveyStatus);
router.put('/surveys/:id', updateSystemSurvey);
router.get('/question-banks', getMasterQuestionBanks);
router.post('/question-banks', createMasterQuestionBank);
router.put('/question-banks/:id', updateMasterQuestionBank);
router.delete('/question-banks/:id', deleteMasterQuestionBank);

module.exports = router;
