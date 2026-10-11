/**
 * Create or promote an admin account safely via CLI or environment variables.
 * Usage:
 *   Interactive:
 *     npm run create-admin
 *   Non-interactive (via env):
 *     ADMIN_EMAIL="admin@example.com" ADMIN_USERNAME="admin_user" ADMIN_PASSWORD="Password123!" npm run create-admin
 */
const path = require('path');
const readline = require('readline');
const { Writable } = require('stream');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/;

// Helper to ask a question with optional masked/hidden input
function askQuestion(rl, query, isPassword = false, mutableStdout = null) {
  return new Promise((resolve) => {
    if (isPassword && mutableStdout) {
      process.stdout.write(query);
      mutableStdout.muted = true;
      rl.question('', (answer) => {
        mutableStdout.muted = false;
        process.stdout.write('\n');
        resolve(answer.trim());
      });
    } else {
      rl.question(query, (answer) => {
        resolve(answer.trim());
      });
    }
  });
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/innofix';
  await mongoose.connect(mongoUri);

  let { ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  // Interactive mode if env vars are missing
  if (!ADMIN_EMAIL || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.log('\n======================================================');
    console.log('👑 INNOFIX AI — Create or Promote Admin Account');
    console.log('======================================================');
    console.log('Enter details for the admin account below:\n');

    const mutableStdout = new Writable({
      write(chunk, encoding, callback) {
        if (!this.muted) {
          process.stdout.write(chunk, encoding);
        }
        callback();
      },
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: true,
    });

    try {
      ADMIN_NAME = await askQuestion(rl, 'Full Name (default: Platform Admin): ');
      if (!ADMIN_NAME) ADMIN_NAME = 'Platform Admin';

      // Email
      while (true) {
        ADMIN_EMAIL = await askQuestion(rl, 'Admin Email: ');
        if (EMAIL_REGEX.test(ADMIN_EMAIL)) break;
        console.log('❌ Invalid email format. Please enter a valid email address.');
      }

      // Username
      while (true) {
        ADMIN_USERNAME = await askQuestion(rl, 'Admin Username (3-30 letters, numbers, _): ');
        if (USERNAME_REGEX.test(ADMIN_USERNAME)) break;
        console.log('❌ Username must be 3-30 characters long and contain only letters, numbers, and underscores.');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

      if (existingUser) {
        console.log(`\nℹ️  An existing account with email "${ADMIN_EMAIL}" was found.`);
        const confirm = await askQuestion(rl, `Do you want to promote "${existingUser.username}" to admin? (y/N): `);
        if (confirm.toLowerCase() !== 'y') {
          console.log('Aborted.');
          rl.close();
          await mongoose.disconnect();
          process.exit(0);
        }
        // Password not needed for existing user promotion
        ADMIN_PASSWORD = null;
      } else {
        // Password with confirmation and validation
        while (true) {
          console.log('\nPassword requirements: At least 10 characters, including upper, lower, number, and symbol.');
          ADMIN_PASSWORD = await askQuestion(rl, 'Admin Password: ', true, mutableStdout);
          
          if (!PASSWORD_REGEX.test(ADMIN_PASSWORD)) {
            console.log('❌ Password does not meet complexity requirements. Try again.');
            continue;
          }

          const confirmPassword = await askQuestion(rl, 'Confirm Password: ', true, mutableStdout);
          if (ADMIN_PASSWORD !== confirmPassword) {
            console.log('❌ Passwords do not match. Try again.');
            continue;
          }

          break;
        }
      }

      rl.close();
    } catch (err) {
      rl.close();
      throw err;
    }
  }

  // Validate values (for both interactive and env-based execution)
  ADMIN_EMAIL = ADMIN_EMAIL.toLowerCase().trim();
  ADMIN_USERNAME = ADMIN_USERNAME.toLowerCase().trim();

  if (!EMAIL_REGEX.test(ADMIN_EMAIL)) {
    console.error('❌ Validation Error: Invalid email format.');
    await mongoose.disconnect();
    process.exit(1);
  }

  if (!USERNAME_REGEX.test(ADMIN_USERNAME)) {
    console.error('❌ Validation Error: Username must be 3-30 characters (letters, numbers, _).');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Check if username is taken by a different user
  const userWithSameUsername = await User.findOne({ username: ADMIN_USERNAME });
  if (userWithSameUsername && userWithSameUsername.email !== ADMIN_EMAIL) {
    console.error(`❌ Conflict Error: Username "${ADMIN_USERNAME}" is already taken by another account.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  // Promote existing or create new
  const existingByEmail = await User.findOne({ email: ADMIN_EMAIL });
  if (existingByEmail) {
    existingByEmail.role = 'admin';
    await existingByEmail.save();

    console.log('\n======================================================');
    console.log('✅ ADMIN PROMOTED SUCCESSFULLY');
    console.log('======================================================');
    console.log(`👤 User:       ${existingByEmail.fullName} (@${existingByEmail.username})`);
    console.log(`📧 Email:      ${existingByEmail.email}`);
    console.log(`🔑 Password:   Existing password preserved`);
    console.log(`🌐 Login URL:  http://localhost:5173/login`);
    console.log('======================================================\n');
  } else {
    if (!ADMIN_PASSWORD || !PASSWORD_REGEX.test(ADMIN_PASSWORD)) {
      console.error('❌ Validation Error: Password must be at least 10 characters with upper, lower, number, and symbol.');
      await mongoose.disconnect();
      process.exit(1);
    }

    const newAdmin = await User.create({
      fullName: ADMIN_NAME || 'Platform Admin',
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      headline: 'Platform Administrator',
      bio: 'Overseeing community trust, safety, and platform operations.',
    });

    console.log('\n======================================================');
    console.log('✅ ADMIN ACCOUNT CREATED SUCCESSFULLY');
    console.log('======================================================');
    console.log(`👤 Name:       ${newAdmin.fullName}`);
    console.log(`🏷️  Username:   @${newAdmin.username}`);
    console.log(`📧 Email:      ${newAdmin.email}`);
    console.log(`🌐 Login URL:  http://localhost:5173/login`);
    console.log('======================================================\n');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
});
