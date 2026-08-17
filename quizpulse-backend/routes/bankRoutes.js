const express = require('express');
const router = express.Router();
const { createBank, getBanks, updateBank, deleteBank } = require('../controllers/bankController');
const authenticateUser = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Protected: Only surveyors and admins can manage banks
router.use(authenticateUser, authorizeRoles('surveyor', 'admin'));

router.post('/', createBank);
router.get('/', getBanks);
router.put('/:id', updateBank);
router.delete('/:id', deleteBank);

module.exports = router;
