const express = require('express');
const router = express.Router();
const { register, login, getMe, seedAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Accepts both GET and POST so you can hit it directly in browser or Postman
router.get('/seed-admin', seedAdmin);
router.post('/seed-admin', seedAdmin);

module.exports = router;
