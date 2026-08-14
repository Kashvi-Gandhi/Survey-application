const express = require('express');
const { isAdmin } = require('../middleware/authMiddleware');
const { getMetrics, getAllSurveyors, toggleSurveyorStatus } = require('../controllers/adminController');

const router = express.Router();

router.use(isAdmin);
router.get('/metrics', getMetrics);
router.get('/surveyors', getAllSurveyors);
router.patch('/surveyors/:id/status', toggleSurveyorStatus);

module.exports = router;
