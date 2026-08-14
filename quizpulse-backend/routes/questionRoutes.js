const express = require('express');
const router = express.Router();
const { createQuestion, createQuestionsBatch, deleteQuestion } = require('../controllers/questionController');
const authenticateUser = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.use(authenticateUser, authorizeRoles('surveyor', 'admin'));

router.post('/', createQuestion);
router.post('/batch', createQuestionsBatch);
router.delete('/:id', deleteQuestion);

module.exports = router;
