const express = require('express');
const router = express.Router();
const { register, login, getMe, resetPassword, topupSelfWallet, seedAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.post('/topup', protect, topupSelfWallet);

// Seed Admin Route
router.get('/seed-admin', seedAdmin);
router.post('/seed-admin', seedAdmin);

module.exports = router;
