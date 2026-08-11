const express = require('express');
const router = express.Router();
const { createBank, getBanks } = require('../controllers/bankController');
const authenticateUser = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Protected: Only surveyors and admins can manage banks
router.use(authenticateUser, authorizeRoles('surveyor', 'admin'));

router.post('/', createBank);
router.get('/', getBanks);

module.exports = router;