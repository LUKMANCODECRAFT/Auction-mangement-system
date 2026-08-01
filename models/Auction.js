const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  productTitle: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  startingPrice: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  imageUrl: { type: String, default: 'default-product.png' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  durationHours: { type: Number, default: 24 },
  status: { 
    type: String, 
    enum: ['active', 'closed', 'expired', 'completed'], 
    default: 'active' 
  },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  exchangePassCode: { type: String },
  bids: [{
    bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bidAmount: { type: Number, required: true },
    bidTime: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Auction', auctionSchema);