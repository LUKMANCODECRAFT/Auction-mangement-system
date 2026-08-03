const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedMasterAdmin = async () => {
  try {
    const adminEmail = 'masteradmin@fud.edu.ng';
    const rawPassword = 'fudmaster2026';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // Seed Master Admin only
    await User.findOneAndUpdate(
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
  } catch (error) {
    console.error('❌ [MASTER SEED ERROR]:', error.message);
  }
};

module.exports = seedMasterAdmin;
