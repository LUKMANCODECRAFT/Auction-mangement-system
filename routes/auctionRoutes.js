const express = require('express');
const router = express.Router();
const {
  getAuctions,
  getAuctionById,
  createAuction,
  placeBid
} = require('../controllers/auctionController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getAuctions);
router.get('/:id', getAuctionById);

// Protected routes
router.post('/', protect, createAuction);
router.post('/bid', protect, placeBid);

module.exports = router;
