const User = require('../models/User');
const Auction = require('../models/Auction');
const { settleAuction } = require('../utils/settlementHelper');

// @desc    Get system overview stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalAuctions = await Auction.countDocuments();
    const activeAuctions = await Auction.countDocuments({ status: 'active' });

    res.status(200).json({
      success: true,
      stats: { totalUsers, totalAdmins, totalAuctions, activeAuctions }
    });
  } catch (error) {
    console.error('Error in getAdminStats:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching admin stats' });
  }
};

// @desc    Get all registered users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('Error in getAllUsers:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching user list' });
  }
};

// @desc    Get all auctions for Admin Overwatch
// @route   GET /api/admin/auctions
// @access  Private (Admin)
exports.getAllAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate('seller', 'fullName email')
      .populate('winner', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: auctions.length, auctions });
  } catch (error) {
    console.error('Error in getAllAuctions:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching all auctions' });
  }
};

// @desc    Promote or Update User Role (Up to 5 Admins Max)
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    if (!['bidder', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    if (role === 'admin') {
      const currentAdminCount = await User.countDocuments({ role: 'admin' });
      if (currentAdminCount >= 5) {
        return res.status(400).json({
          success: false,
          message: 'Maximum admin limit reached! Only 5 admin accounts are allowed.'
        });
      }
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.fullName} updated to role: ${role.toUpperCase()}`,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Error in updateUserRole:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating user role' });
  }
};

// @desc    Top up user virtual wallet
// @route   PUT /api/admin/users/:id/wallet
// @access  Private (Admin)
exports.topupWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const topupAmount = parseFloat(amount);

    if (isNaN(topupAmount) || topupAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive amount required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.walletBalance = (user.walletBalance || 0) + topupAmount;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Credited ₦${topupAmount.toLocaleString()} to ${user.fullName}'s wallet`,
      walletBalance: user.walletBalance
    });
  } catch (error) {
    console.error('Error in topupWallet:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating wallet' });
  }
};

// @desc    Delete/Moderate Auction Listing
// @route   DELETE /api/admin/auctions/:id
// @access  Private (Admin)
exports.deleteAuction = async (req, res) => {
  try {
    const auction = await Auction.findByIdAndDelete(req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }
    res.status(200).json({ success: true, message: 'Auction moderated and deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAuction:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting auction' });
  }
};

// @desc    Force Settle Auction Listing Now
// @route   POST /api/admin/auctions/:id/settle
// @access  Private (Admin)
exports.forceSettleAuction = async (req, res) => {
  try {
    const settled = await settleAuction(req.params.id, req.io);
    if (!settled) {
      return res.status(400).json({ success: false, message: 'Could not settle auction' });
    }
    res.status(200).json({
      success: true,
      message: `Auction "${settled.productTitle}" settled successfully! Winner: ${settled.exchangePassCode || 'No bids'}`,
      auction: settled
    });
  } catch (error) {
    console.error('Error in forceSettleAuction:', error.message);
    res.status(500).json({ success: false, message: 'Server error force-settling auction' });
  }
};
