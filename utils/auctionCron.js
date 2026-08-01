const cron = require('node-cron');
const { settleExpiredAuctions } = require('./settlementHelper');

const initAuctionCron = (io) => {
  // Check and settle expired auctions every 15 seconds for responsiveness
  cron.schedule('*/15 * * * * *', async () => {
    await settleExpiredAuctions(io);
  });
};

module.exports = initAuctionCron;
