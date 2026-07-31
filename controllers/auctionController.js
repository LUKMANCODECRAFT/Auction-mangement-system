const Auction = require('../models/Auction');
const User = require('../models/User');

// @desc    Get all active auctions
// @route   GET /api/auctions
// @access  Public
exports.getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({ status: 'active' })
      .populate('seller', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: auctions.length,
      auctions
    });
  } catch (error) {
    console.error('Error in getAuctions:', error.message);
    res.status(500).json({ success: false, message: 'Server Error fetching auctions' });
  }
};

// @desc    Get single auction by ID
// @route   GET /api/auctions/:id
// @access  Public
exports.getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'fullName email')
      .populate('bids.bidder', 'fullName email');

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction item not found' });
    }

    res.status(200).json({
      success: true,
      auction
    });
  } catch (error) {
    console.error('Error in getAuctionById:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Invalid Auction ID format' });
    }
    res.status(500).json({ success: false, message: 'Server Error fetching item details' });
  }
};

// @desc    Create a new auction listing
// @route   POST /api/auctions
// @access  Private (Seller/Admin)
exports.createAuction = async (req, res) => {
  try {
    const { productTitle, category, startingPrice, durationHours, imageUrl, description } = req.body;

    if (!productTitle || !category || !startingPrice || !durationHours || !description) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    const auction = await Auction.create({
      productTitle,
      category,
      startingPrice,
      currentPrice: startingPrice,
      durationHours: parseFloat(durationHours),
      imageUrl: imageUrl || 'https://via.placeholder.com/400x250?text=FUD+Campus+Item',
      description,
      seller: req.user._id,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      auction
    });
  } catch (error) {
    console.error('Error in createAuction:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating auction listing' });
  }
};

// @desc    Place a bid on an auction
// @route   POST /api/auctions/bid
// @access  Private (Bidder)
exports.placeBid = async (req, res) => {
  try {
    const { auctionId, bidAmount } = req.body;
    const userId = req.user._id;

    if (!auctionId || !bidAmount) {
      return res.status(400).json({ success: false, message: 'Auction ID and Bid Amount are required' });
    }

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction item not found' });
    }

    if (auction.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This auction has ended or is inactive' });
    }

    // Anti-self bidding check
    if (auction.seller && auction.seller.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot bid on your own listed product' });
    }

    const parsedBid = parseFloat(bidAmount);
    if (isNaN(parsedBid) || parsedBid <= auction.currentPrice) {
      return res.status(400).json({
        success: false,
        message: `Your bid must be strictly higher than ₦${(auction.currentPrice || 0).toLocaleString()}`
      });
    }

    // Wallet Balance Verification
    const user = await User.findById(userId);
    if (!user || user.walletBalance < parsedBid) {
      const balance = user ? user.walletBalance : 0;
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. You have ₦${balance.toLocaleString()} but attempted to bid ₦${parsedBid.toLocaleString()}`
      });
    }

    // Safely update price and bids array using exact schema keys
    auction.currentPrice = parsedBid;
    if (!Array.isArray(auction.bids)) {
      auction.bids = [];
    }

    // Map properties to match Auction Schema validation rules
    auction.bids.push({
      bidder: userId,
      bidAmount: parsedBid,
      amount: parsedBid,
      time: new Date()
    });

    await auction.save();

    // Broadcast live update via Socket.IO
    if (req.io) {
      req.io.emit('bidUpdated', {
        auctionId: auction._id,
        newPrice: auction.currentPrice,
        bidderName: user.fullName
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bid placed successfully!',
      auction
    });

  } catch (error) {
    console.error('Error in placeBid:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error placing bid' });
  }
};
