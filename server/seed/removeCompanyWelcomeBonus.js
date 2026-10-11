// Removes the 60-point welcome bonus from EXISTING company accounts (companies now start at 0).
//   Preview (changes nothing):  node seed/removeCompanyWelcomeBonus.js
//   Apply:                      node seed/removeCompanyWelcomeBonus.js --apply
try { require('dotenv').config(); } catch (e) { /* dotenv optional */ }
const mongoose = require('mongoose');
const User = require('../models/User');
const ReputationEvent = require('../models/ReputationEvent');

const APPLY = process.argv.includes('--apply');
const BADGE_THRESHOLDS = { bronze: 100, silver: 200, gold: 350, platinum: 1000 };
const levelFor = (p) => (p >= 1000 ? 5 : p >= 350 ? 4 : p >= 200 ? 3 : p >= 100 ? 2 : 1);

(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) { console.error('No MONGODB_URI / MONGO_URI found in server/.env'); process.exit(1); }
  await mongoose.connect(uri);

  const companies = await User.find({ role: 'company' }).select('username reputation weeklyPoints monthlyPoints badges level');
  let touched = 0;

  for (const u of companies) {
    const welcome = await ReputationEvent.find({ user: u._id, action: 'signup_welcome_bonus' }).select('points');
    const totalEvents = await ReputationEvent.countDocuments({ user: u._id });

    let remove = 0;
    let why = '';
    if (welcome.length) {
      remove = welcome.reduce((s, e) => s + (e.points || 0), 0);
      why = 'welcome bonus removed';
    } else if (totalEvents === 0 && u.reputation === 60) {
      remove = 60; // 60 was written directly (no ledger entry), e.g. by the first script
      why = 'stray 60 with no ledger entry';
    }
    if (!remove) continue;

    const rep = Math.max(0, (u.reputation || 0) - remove);
    const badges = (u.badges || []).filter((b) => !(b.id in BADGE_THRESHOLDS) || rep >= BADGE_THRESHOLDS[b.id]);
    console.log(`${APPLY ? 'FIXED     ' : 'WOULD FIX '} ${u.username}: ${u.reputation || 0} -> ${rep}  (${why})`);
    touched++;

    if (APPLY) {
      if (welcome.length) await ReputationEvent.deleteMany({ user: u._id, action: 'signup_welcome_bonus' });
      await User.updateOne({ _id: u._id }, { $set: {
        reputation: rep,
        badges,
        level: levelFor(rep),
        weeklyPoints: Math.max(0, (u.weeklyPoints || 0) - remove),
        monthlyPoints: Math.max(0, (u.monthlyPoints || 0) - remove)
      } });
    }
  }

  console.log(`\n${touched} company account(s) ${APPLY ? 'updated' : 'would be updated. Re-run with --apply to write the changes'}.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
