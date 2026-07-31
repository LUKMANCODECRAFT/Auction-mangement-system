const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: [true, 'Bid must be linked to an auction'],
    index: true
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Bid must be linked to a bidder']
  },
  bidAmount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [1, 'Bid amount must be greater than zero']
  }
}, {
  timestamps: true
});

// PROGRAMMATIC ANTI-SHILL BIDDING HOOK (DATABASE-LEVEL INTEGRITY)
bidSchema.pre('save', async function (next) {
  const Auction = mongoose.model('Auction');
  
  const targetAuction = await Auction.findById(this.auction);
  if (!targetAuction) {
    return next(new Error('Target auction listing does not exist.'));
  }

  // Anti-Shill Verification: Ensure bidder is not the seller
  if (targetAuction.seller.toString() === this.bidder.toString()) {
    return next(new Error('SECURITY VIOLATION (Anti-Shill): Sellers are strictly prohibited from bidding on their own items.'));
  }

  // Ensure auction is active
  if (targetAuction.status !== 'active') {
    return next(new Error('TRANSACTION FAILED: This auction is not currently active.'));
  }

  // Ensure bid exceeds current highest price
  if (this.bidAmount <= targetAuction.currentPrice) {
    return next(new Error(`INVALID BID: Bid amount must be strictly higher than NGN ${targetAuction.currentPrice}`));
  }

  next();
});

module.exports = mongoose.model('Bid', bidSchema);