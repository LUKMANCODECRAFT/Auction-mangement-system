const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fud_auction_db'
    );
    console.log(`[DATABASE] MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DATABASE ERROR] Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;