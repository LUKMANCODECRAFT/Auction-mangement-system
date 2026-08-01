const Auction = require('../models/Auction');
const User = require('../models/User');

/**
 * Settles an auction when duration expires or when manually triggered by Admin.
 * Handles financial transfers (deduct winner wallet, credit seller wallet)
 * and generates official FUD Exchange Pass Code.
 */
const settleAuction = async (auctionInput, io = null) => {
  try {
    let auction = auctionInput;

    // Fetch full populated document if an ID or lean doc was passed
    if (typeof auction === 'string' || !auction.bids || !auction.seller) {
      auction = await Auction.findById(auctionInput)
        .populate('seller')
        .populate('bids.bidder');
    }

    if (!auction) return null;

    // Already settled
    if (auction.status === 'completed' || auction.status === 'closed') {
      return auction;
    }

    auction.status = 'completed';

    if (Array.isArray(auction.bids) && auction.bids.length > 0) {
      // Sort bids descending by bidAmount
      const sortedBids = auction.bids.sort((a, b) => {
        const amtA = a.bidAmount || a.amount || 0;
        const amtB = b.bidAmount || b.amount || 0;
        return amtB - amtA;
      });

      const winningBid = sortedBids[0];
      const winningAmount = winningBid.bidAmount || winningBid.amount || auction.currentPrice;
      const winnerId = winningBid.bidder && winningBid.bidder._id ? winningBid.bidder._id : winningBid.bidder;

      auction.winner = winnerId;
      auction.currentPrice = winningAmount;

      // Generate unique campus Exchange Pass Code if not present
      if (!auction.exchangePassCode) {
        const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        auction.exchangePassCode = `FUD-PASS-${randomCode}`;
      }

      // Financial Settlement: Deduct winner, Credit seller
      if (winnerId) {
        const winnerUser = await User.findById(winnerId);
        if (winnerUser) {
          winnerUser.walletBalance = Math.max(0, (winnerUser.walletBalance || 0) - winningAmount);
          await winnerUser.save();
          console.log(`💰 [FINANCE] Deducted ₦${winningAmount.toLocaleString()} from Winner (${winnerUser.fullName}). New balance: ₦${winnerUser.walletBalance.toLocaleString()}`);
        }
      }

      const sellerId = auction.seller && auction.seller._id ? auction.seller._id : auction.seller;
      if (sellerId) {
        const sellerUser = await User.findById(sellerId);
        if (sellerUser) {
          sellerUser.walletBalance = (sellerUser.walletBalance || 0) + winningAmount;
          await sellerUser.save();
          console.log(`💰 [FINANCE] Credited ₦${winningAmount.toLocaleString()} to Seller (${sellerUser.fullName}). New balance: ₦${sellerUser.walletBalance.toLocaleString()}`);
        }
      }
    } else {
      // No bids placed before expiration
      auction.status = 'expired';
    }

    await auction.save();

    console.log(`🔒 [SETTLEMENT] Auction ${auction._id} (${auction.productTitle}) successfully settled as ${auction.status.toUpperCase()}.`);

    if (io) {
      io.emit('auctionEnded', {
        auctionId: auction._id,
        productTitle: auction.productTitle,
        winner: auction.winner,
        exchangePassCode: auction.exchangePassCode,
        finalPrice: auction.currentPrice
      });
    }

    return auction;

  } catch (err) {
    console.error('Error settling auction:', err.message);
    return null;
  }
};

/**
 * Checks all active auctions and settles any where now >= endTime
 */
const settleExpiredAuctions = async (io = null) => {
  try {
    const activeAuctions = await Auction.find({ status: 'active' });
    const now = Date.now();

    for (const auction of activeAuctions) {
      const startTime = new Date(auction.createdAt || auction.startTime).getTime();
      const durationMs = (auction.durationHours || 24) * 60 * 60 * 1000;
      const endTime = startTime + durationMs;

      if (now >= endTime) {
        await settleAuction(auction, io);
      }
    }
  } catch (err) {
    console.error('Error in settleExpiredAuctions:', err.message);
  }
};

module.exports = {
  settleAuction,
  settleExpiredAuctions
};
