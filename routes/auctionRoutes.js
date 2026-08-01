const express = require('express');
const router = express.Router();
const {
  getAuctions,
  getAuctionById,
  createAuction,
  placeBid,
  getMyAuctions,
  getMyBids
} = require('../controllers/auctionController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getAuctions);

// Protected routes (Specific routes must come before :id parameter route)
router.get('/my-auctions', protect, getMyAuctions);
router.get('/my-bids', protect, getMyBids);
router.post('/', protect, createAuction);
router.post('/bid', protect, placeBid);

// Parametric route
router.get('/:id', getAuctionById);

module.exports = router;
