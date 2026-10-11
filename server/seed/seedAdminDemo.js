const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Report = require('../models/Report');
const AdminAction = require('../models/AdminAction');
const RecommendationLog = require('../models/RecommendationLog');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedAdminDemo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Make sure we have users
    const users = await User.find().limit(10);
    if (users.length < 2) {
      console.log('Not enough users. Please run the main seeder first.');
      process.exit(1);
    }

    const admin = users.find(u => u.role === 'admin') || users[0];
    const reporter = users[1];
    const target = users[2] || users[0];

    // Seed Reports
    await Report.deleteMany({});
    const reports = [
      { reporter: reporter._id, targetType: 'user', targetId: target._id, reason: 'spam', details: 'Sending spam messages', status: 'pending' },
      { reporter: reporter._id, targetType: 'post', targetId: target._id, reason: 'harassment', details: 'Rude comments', status: 'pending' },
      { reporter: reporter._id, targetType: 'project', targetId: target._id, reason: 'misinformation', details: 'Fake project', status: 'action_taken', resolvedBy: admin._id, resolutionNotes: 'Content removed' },
    ];
    await Report.insertMany(reports);
    console.log('Seeded Reports');

    // Seed RecommendationLogs
    await RecommendationLog.deleteMany({});
    const logs = [];
    for (let i = 0; i < 50; i++) {
      const isPersonalized = Math.random() > 0.5;
      const isClick = Math.random() > 0.8;
      
      logs.push({
        user: reporter._id,
        event: isClick ? 'click' : 'served',
        strategy: isPersonalized ? 'personalized' : 'trending',
        items: [
          { itemId: target._id, itemType: 'project', title: 'Demo Project', score: Math.random() * 100 }
        ],
        createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
      });
    }
    await RecommendationLog.insertMany(logs);
    console.log('Seeded AI Logs');

    // Seed Admin Actions
    await AdminAction.deleteMany({});
    await AdminAction.create({
      admin: admin._id,
      action: 'promoted_admin',
      targetUser: reporter._id,
      details: 'Initial setup'
    });
    console.log('Seeded Admin Actions');

    console.log('Admin Demo Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin demo:', error);
    process.exit(1);
  }
}

seedAdminDemo();
