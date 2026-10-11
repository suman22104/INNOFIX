const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

const { getMongoUri } = require('../config/db');

const doctor = async () => {
  console.log('🩺 INNOFIX Server Doctor Diagnostic');
  console.log('==================================');
  
  const envVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];
  let envErrors = 0;
  
  console.log('\n[1] Environment Variables:');
  for (const v of envVars) {
    if (process.env[v]) {
      console.log(`  ✅ ${v} is set`);
    } else {
      console.log(`  ❌ ${v} is MISSING`);
      envErrors++;
    }
  }

  console.log('\n[2] Database Connection:');
  const mongoUri = getMongoUri();
  console.log(`  Target URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
  
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('  ✅ Connection Successful');
    
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    console.log('\n[3] Database Health:');
    console.log(`  👥 Total Users: ${userCount}`);
    console.log(`  🛡️ Admins:      ${adminCount}`);
    
    if (adminCount === 0) {
      console.log('  ⚠️ WARNING: No admin accounts found. Login will fail for admins.');
    } else {
      console.log('  ✅ Admin accounts exist.');
    }

    await mongoose.connection.close();
  } catch (err) {
    console.log(`  ❌ Connection Failed: ${err.message}`);
    if (err.name === 'MongoNetworkError' || err.message.includes('ECONNREFUSED')) {
      console.log('     HINT: Is MongoDB running on this machine or is your IP whitelisted?');
    }
  }
  
  console.log('\nDiagnostic Complete.');
  process.exit(envErrors > 0 ? 1 : 0);
};

doctor();
