const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@fud.edu.ng' });

    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await User.create({
        fullName: 'FUD System Administrator',
        email: 'admin@fud.edu.ng',
        password: hashedPassword,
        role: 'admin',
        walletBalance: 500000
      });

      console.log('👑 [SEED] Default Admin account created successfully (admin@fud.edu.ng / admin123)');
    }
  } catch (error) {
    console.error('❌ [SEED ERROR] Failed to seed default admin user:', error.message);
  }
};

module.exports = seedAdmin;
