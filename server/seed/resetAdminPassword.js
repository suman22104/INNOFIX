const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: __dirname + '/../.env' });

const { getMongoUri } = require('../config/db');

const resetPassword = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/innofix';
    await mongoose.connect(mongoUri);

    const User = require('../models/User');
    const adminEmail = process.argv[2] || process.env.ADMIN_BOOTSTRAP_EMAIL;

    if (!adminEmail) {
      console.error('❌ Please provide an admin email as an argument or set ADMIN_BOOTSTRAP_EMAIL in .env');
      console.log('Usage: npm run reset-admin-password <email>');
      process.exit(1);
    }

    const admin = await User.findOne({ email: adminEmail, role: 'admin' });
    
    if (!admin) {
      console.error(`❌ Admin account with email ${adminEmail} not found!`);
      process.exit(1);
    }

    const defaultPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'Admin123!';
    
    // Bypass pre-save hooks to ensure hashing if needed, but since we rely on pre-save hook:
    admin.password = defaultPassword;
    admin.mustChangePassword = true;
    await admin.save();

    console.log(`✅ Password for ${adminEmail} successfully reset to: ${defaultPassword}`);
    console.log(`   User will be prompted to change it on next login.`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting password:', err);
    process.exit(1);
  }
};

resetPassword();
