const cron = require('node-cron');
const Auction = require('../models/Auction');

const initAuctionCron = (io) => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const activeAuctions = await Auction.find({ status: 'active' }).populate('bids.bidder');

      for (const auction of activeAuctions) {
        const startTime = new Date(auction.createdAt).getTime();
        const durationMs = (auction.durationHours || 24) * 60 * 60 * 1000;
        const endTime = startTime + durationMs;
        const now = Date.now();

        if (now >= endTime) {
          auction.status = 'completed';

          if (auction.bids && auction.bids.length > 0) {
            // Sort bids by amount descending to determine winner
            const sortedBids = auction.bids.sort((a, b) => (b.bidAmount || b.amount) - (a.bidAmount || a.amount));
            const winningBid = sortedBids[0];

            auction.winner = winningBid.bidder._id || winningBid.bidder;
            
            // Generate unique campus Exchange Pass Code
            const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
            auction.exchangePassCode = `FUD-PASS-${randomCode}`;
          }

          await auction.save();

          console.log(`🔒 [CRON] Auction ${auction._id} (${auction.productTitle}) successfully settled and closed.`);

          if (io) {
            io.emit('auctionEnded', {
              auctionId: auction._id,
              productTitle: auction.productTitle,
              winner: auction.winner,
              exchangePassCode: auction.exchangePassCode
            });
          }
        }
      }
    } catch (err) {
      console.error('Error in auction settlement cron job:', err.message);
    }
  });
};

module.exports = initAuctionCron;
