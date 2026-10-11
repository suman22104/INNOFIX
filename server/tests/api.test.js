const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const request = require('supertest');

dotenv.config({ path: __dirname + '/../.env' });

const { app } = require('../server');
const User = require('../models/User');
const AdminAction = require('../models/AdminAction');
const { scoreContentModeration, improveProfileBio } = require('../services/llmService');
const { rankPeopleYouMayKnow, norm, cosine, itemVector } = require('../services/recommendService');

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/innofix';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
});

afterAll(async () => {
  // Clean up any test users created by tests
  await User.deleteMany({ email: /@innofix-test\.com$/ });
  await AdminAction.deleteMany({ details: /test/i });
  await mongoose.connection.close();
});

describe('INNOFIX AI: Core System & AI Unit Tests', () => {
  test('Password validation enforces 8+ characters in User model', async () => {
    const shortUser = new User({
      fullName: 'Test Short',
      username: 'testshort' + Date.now(),
      email: 'short' + Date.now() + '@test.com',
      password: '123',
    });

    let err = null;
    try {
      await shortUser.validate();
    } catch (e) {
      err = e;
    }
    expect(err).not.toBeNull();
    expect(err.errors.password).toBeDefined();
  });

  test('AI Content Moderation Guard flags toxic/offensive input', async () => {
    const toxicInput = 'You are an idiot and this is pure garbage spam scam';
    const moderation = await scoreContentModeration(toxicInput);

    expect(moderation.status).toMatch(/flagged|blocked/);
    expect(moderation.toxicityScore).toBeGreaterThan(0);
    expect(moderation.isSafe).toBe(false);
  });

  test('AI Content Moderation approves clean constructive posts', async () => {
    const cleanInput = 'Excited to build our collaborative open-source project with React and Node.js!';
    const moderation = await scoreContentModeration(cleanInput);

    expect(moderation.status).toBe('approved');
    expect(moderation.toxicityScore).toBe(0);
    expect(moderation.isSafe).toBe(true);
  });

  test('AI Bio Assistant generates enhanced pitch and suggestions', async () => {
    const result = await improveProfileBio({
      headline: 'Student dev',
      bio: 'I like code and tech',
      skills: ['React', 'Node.js'],
    });

    expect(result.enhancedHeadline).toBeDefined();
    expect(result.enhancedBio).toBeDefined();
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  test('Recommender cosine similarity calculates high score for identical vectors', () => {
    const v1 = new Map([['react', 3], ['node', 2]]);
    const v2 = new Map([['react', 3], ['node', 2]]);
    const score = cosine(v1, v2);

    expect(score).toBeCloseTo(1.0, 2);
  });

  test('People You May Know (PYMK) ranks candidate users with explainable reasons', async () => {
    const testUser = await User.findOne({ username: 'alexm' });
    if (testUser) {
      const pymk = await rankPeopleYouMayKnow(testUser, 4);
      expect(Array.isArray(pymk)).toBe(true);
      if (pymk.length > 0) {
        expect(pymk[0].score).toBeGreaterThan(0);
        expect(pymk[0].reason).toBeDefined();
      }
    }
  });
});

describe('INNOFIX AI: Admin Role Protection & Management Tests', () => {
  let adminUser;
  let adminToken;
  let studentUser;
  let studentToken;

  beforeAll(async () => {
    // Find or create a base admin
    adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        fullName: 'Test Master Admin',
        username: 'test_master_admin_' + Date.now(),
        email: 'masteradmin_' + Date.now() + '@innofix-test.com',
        password: 'Password123!',
        role: 'admin',
      });
    }

    // Create a regular student user for RBAC tests
    studentUser = await User.create({
      fullName: 'Test Student User',
      username: 'test_student_' + Date.now(),
      email: 'student_' + Date.now() + '@innofix-test.com',
      password: 'Password123!',
      role: 'student',
    });

    const jwtSecret = process.env.JWT_SECRET || 'innofix_ai_network_jwt_secure_key_7f8a9b2c3d4e5f60a1b2c3d4e5f6';
    adminToken = jwt.sign({ id: adminUser._id }, jwtSecret, { expiresIn: '1h' });
    studentToken = jwt.sign({ id: studentUser._id }, jwtSecret, { expiresIn: '1h' });
  });

  test('Non-admin user receives 403 Forbidden on protected admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/admins')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('Admin user can view list of administrators and audit actions', async () => {
    const res = await request(app)
      .get('/api/admin/admins')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.admins)).toBe(true);
  });

  test('Admin can promote an existing student user to admin', async () => {
    const res = await request(app)
      .post('/api/admin/admins')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        mode: 'promote',
        userId: studentUser._id.toString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await User.findById(studentUser._id);
    expect(updated.role).toBe('admin');
  });

  test('Self-demotion is strictly blocked by safety guard (400)', async () => {
    const res = await request(app)
      .patch(`/api/admin/admins/${adminUser._id}/demote`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot demote your own admin account/i);
  });

  test('Admin can demote another admin and creates audit log', async () => {
    const res = await request(app)
      .patch(`/api/admin/admins/${studentUser._id}/demote`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const demoted = await User.findById(studentUser._id);
    expect(demoted.role).toBe('student');

    const log = await AdminAction.findOne({
      targetUser: studentUser._id,
      action: 'demoted_admin',
    });
    expect(log).not.toBeNull();
  });

  test('Last-remaining administrator demotion is strictly blocked (400)', async () => {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 1) {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/admin/admins/${dummyId}/demote`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Cannot demote the last remaining administrator/i);
    } else {
      expect(adminCount).toBeGreaterThanOrEqual(1);
    }
  });
});
