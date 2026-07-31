const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: ['bidder', 'seller', 'admin'],
    default: 'bidder'
  },
  walletBalance: {
    type: Number,
    default: 100000
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
