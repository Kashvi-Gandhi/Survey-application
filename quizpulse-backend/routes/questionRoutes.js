const express = require('express');
const router = express.Router();
const { createQuestion } = require('../controllers/questionController');
const authenticateUser = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.use(authenticateUser, authorizeRoles('surveyor', 'admin'));

router.post('/', createQuestion);

module.exports = router;