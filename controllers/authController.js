const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper: Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fud_secret_key_123',
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'bidder',
      walletBalance: role === 'admin' ? 500000 : 100000
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance
      }
    });

  } catch (error) {
    console.error('Error in register:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance
      }
    });

  } catch (error) {
    console.error('Error in login:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error in getMe:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
};

// @desc    Force reset/seed admin account directly in MongoDB Atlas
// @route   GET/POST /api/auth/seed-admin
// @access  Public
exports.seedAdmin = async (req, res) => {
  try {
    const adminEmail = 'admin@fud.edu.ng';
    const rawPassword = 'admin123';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const adminUser = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        fullName: 'FUD System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        walletBalance: 500000
      },
      { upsert: true, new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: '👑 Admin credentials set successfully!',
      credentials: {
        email: adminEmail,
        password: rawPassword
      }
    });

  } catch (error) {
    console.error('Error seeding admin:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
