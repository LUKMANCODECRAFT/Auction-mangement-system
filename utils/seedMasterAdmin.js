const User = require('../models/User');
const Auction = require('../models/Auction');
const bcrypt = require('bcryptjs');

const seedMasterAdmin = async () => {
  try {
    const adminEmail = 'masteradmin@fud.edu.ng';
    const rawPassword = 'fudmaster2026';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // 1. Seed Master Admin
    const adminUser = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        fullName: 'FUD Master Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        walletBalance: 1000000
      },
      { upsert: true, new: true, runValidators: false }
    );

    console.log('👑 [MASTER SEED] Master Admin Ready: masteradmin@fud.edu.ng / fudmaster2026');

    // 2. Seed Campus Seller Accounts if needed
    const seller1 = await User.findOneAndUpdate(
      { email: 'abubakar@fud.edu.ng' },
      {
        fullName: 'Abubakar Ibrahim (Hostel C)',
        email: 'abubakar@fud.edu.ng',
        password: hashedPassword,
        role: 'seller',
        walletBalance: 120000
      },
      { upsert: true, new: true, runValidators: false }
    );

    const seller2 = await User.findOneAndUpdate(
      { email: 'fatima@fud.edu.ng' },
      {
        fullName: 'Fatima Usman (Faculty of Computing)',
        email: 'fatima@fud.edu.ng',
        password: hashedPassword,
        role: 'seller',
        walletBalance: 150000
      },
      { upsert: true, new: true, runValidators: false }
    );

    // 3. Seed Active Campus Auctions if less than 3 active auctions exist
    const activeCount = await Auction.countDocuments({ status: 'active' });
    if (activeCount < 3) {
      const sampleAuctions = [
        {
          productTitle: 'HP EliteBook 840 G5 Core i5 (16GB RAM, 512GB SSD)',
          category: 'Electronics & Hardware',
          startingPrice: 180000,
          currentPrice: 185000,
          durationHours: 48,
          imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
          description: 'Perfect for Computer Science / Software Engineering research projects. Battery holds 5+ hours. Campus pickup at Hostel C Block B.',
          seller: seller1._id,
          status: 'active'
        },
        {
          productTitle: 'Hostel Compact Refrigerator (Thermocool 90L)',
          category: 'Hostel & Room Appliances',
          startingPrice: 45000,
          currentPrice: 48000,
          durationHours: 24,
          imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
          description: 'In 100% working condition. Fast cooling, low power consumption suitable for hostel power supply. Pickup at Male Hostel 2.',
          seller: seller1._id,
          status: 'active'
        },
        {
          productTitle: 'Software Engineering (10th Edition) Textbook + Lecture Notes',
          category: 'Academic Books',
          startingPrice: 3500,
          currentPrice: 4000,
          durationHours: 72,
          imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
          description: 'Complete CSE 499 & CSE 301 course reference book. Clean pages with zero markings. Free CSE past questions booklet included!',
          seller: seller2._id,
          status: 'active'
        },
        {
          productTitle: 'Campus Transport Mountain Bicycle (Shimano 21-Speed)',
          category: 'Vehicles & Cycles',
          startingPrice: 35000,
          currentPrice: 37500,
          durationHours: 36,
          imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
          description: 'Ideal for riding between FUD Permanent Site gates and lecture halls. Strong disc brakes and smooth gear shifting.',
          seller: seller2._id,
          status: 'active'
        }
      ];

      await Auction.insertMany(sampleAuctions);
      console.log('📦 [SAMPLE SEED] Added live campus auctions for FUD case study demo!');
    }

  } catch (error) {
    console.error('❌ [MASTER SEED ERROR]:', error.message);
  }
};

module.exports = seedMasterAdmin;
