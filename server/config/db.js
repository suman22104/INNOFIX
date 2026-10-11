const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/innofix';
    console.log(`Connecting to MongoDB at: ${mongoUri.replace(/\/\/.*@/, '//***@')}`);
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Note: You can provide a cloud MongoDB Atlas URI in server/.env if local MongoDB is not running.');
  }
};

module.exports = { connectDB };
