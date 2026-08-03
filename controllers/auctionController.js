const Auction = require('../models/Auction');
const User = require('../models/User');
const { settleExpiredAuctions, settleAuction } = require('../utils/settlementHelper');

// Safe ObjectId string extractor helper
const getDocId = (doc) => {
  if (!doc) return '';
  if (typeof doc === 'string') return doc;
  if (doc._id) return doc._id.toString();
  return doc.toString();
};

// @desc    Get auctions (supports status, category, search query filtering)
// @route   GET /api/auctions
// @access  Public
exports.getAuctions = async (req, res) => {
  try {
    // Settle any expired auctions automatically
    await settleExpiredAuctions(req.io);

    const { status, category, search } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    } else if (!status) {
      filter.status = 'active';
    }

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { productTitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const auctions = await Auction.find(filter)
      .populate('seller', 'fullName email')
      .populate('winner', 'fullName email')
      .populate('bids.bidder', 'fullName email')
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
    await settleExpiredAuctions(req.io);

    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'fullName email')
      .populate('winner', 'fullName email')
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

    // Auto settle if expired before bid attempt
    await settleExpiredAuctions(req.io);

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction item not found' });
    }

    if (auction.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This auction has ended or is inactive' });
    }

    // Anti-self bidding check
    if (getDocId(auction.seller) === getDocId(userId)) {
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

    // Update price and bids array
    auction.currentPrice = parsedBid;
    if (!Array.isArray(auction.bids)) {
      auction.bids = [];
    }

    auction.bids.push({
      bidder: userId,
      bidAmount: parsedBid,
      bidTime: new Date()
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

// @desc    Get user's own listings (Active & Settled)
// @route   GET /api/auctions/my-auctions
// @access  Private
exports.getMyAuctions = async (req, res) => {
  try {
    await settleExpiredAuctions(req.io);

    const auctions = await Auction.find({ seller: req.user._id })
      .populate('winner', 'fullName email')
      .populate('bids.bidder', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: auctions.length,
      auctions
    });
  } catch (error) {
    console.error('Error in getMyAuctions:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch your auctions' });
  }
};

// @desc    Get user's placed bids and won items
// @route   GET /api/auctions/my-bids
// @access  Private
exports.getMyBids = async (req, res) => {
  try {
    await settleExpiredAuctions(req.io);

    const userId = getDocId(req.user._id);

    // Find all auctions containing bids from this user OR won by this user
    const auctions = await Auction.find({
      $or: [
        { 'bids.bidder': req.user._id },
        { winner: req.user._id }
      ]
    })
      .populate('seller', 'fullName email')
      .populate('winner', 'fullName email')
      .sort({ updatedAt: -1 });

    const formattedBids = auctions.map(auction => {
      const userBids = (auction.bids || []).filter(b => b.bidder && getDocId(b.bidder) === userId);
      const maxUserBid = userBids.reduce((max, b) => {
        const amt = b.bidAmount || b.amount || 0;
        return amt > max ? amt : max;
      }, 0);

      const isWinner = getDocId(auction.winner) === userId;

      return {
        auctionId: auction._id,
        productTitle: auction.productTitle,
        category: auction.category,
        imageUrl: auction.imageUrl,
        currentPrice: auction.currentPrice,
        myHighestBid: maxUserBid || (isWinner ? auction.currentPrice : 0),
        status: auction.status,
        isWinner,
        exchangePassCode: isWinner ? auction.exchangePassCode : null,
        seller: auction.seller
      };
    });

    res.status(200).json({
      success: true,
      count: formattedBids.length,
      bids: formattedBids
    });
  } catch (error) {
    console.error('Error in getMyBids:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch your bid activity' });
  }
};

