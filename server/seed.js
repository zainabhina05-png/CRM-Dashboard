#!/usr/bin/env node
/**
 * Seed runner — lives inside server/ so all deps resolve correctly.
 * Usage (from project root):
 *   cd server && node seed.js
 *   cd server && node seed.js reset
 *
 * Or via npm scripts from project root (package.json forwards here).
 */

const path = require('path');
const fs   = require('fs');

// ── Load env ────────────────────────────────────────────────
// Priority: SEED_ENV_FILE env var → .env.seed → .env.production → .env
const candidates = [
  process.env.SEED_ENV_FILE,
  path.join(__dirname, '.env.seed'),
  path.join(__dirname, '.env.production'),
  path.join(__dirname, '.env'),
].filter(Boolean);

let loaded = false;
for (const f of candidates) {
  if (f && fs.existsSync(f)) {
    require('dotenv').config({ path: f });
    console.log(`[seed] Loaded env from: ${path.basename(f)}`);
    loaded = true;
    break;
  }
}
if (!loaded) {
  console.warn('[seed] WARNING: No .env file found — relying on system environment');
}

// ── Safety guards ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED) {
  console.error('❌ SEED BLOCKED: NODE_ENV=production. Set ALLOW_SEED=true to override.');
  process.exit(1);
}

// ── Mongoose + models ────────────────────────────────────────
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { faker } = require('@faker-js/faker');

const User     = require('./models/User');
const Lead     = require('./models/Lead');
const Reminder = require('./models/Reminder');

faker.seed(42);

// ── DB connect ───────────────────────────────────────────────
async function connect() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`✅ Connected to: ${mongoose.connection.name}`);
}

// ── Clear ────────────────────────────────────────────────────
async function clearAll() {
  const [r, l, u] = await Promise.all([
    Reminder.deleteMany({}),
    Lead.deleteMany({}),
    User.deleteMany({}),
  ]);
  console.log(`🧹 Cleared: ${u.deletedCount} users, ${l.deletedCount} leads, ${r.deletedCount} reminders`);
}

// ── Create demo users ────────────────────────────────────────
async function createUsers() {
  const defs = [
    { name: 'Admin Demo User',   email: 'admin@leadflow-demo.com',   password: 'demo123!', role: 'admin'     },
    { name: 'Manager Demo User', email: 'manager@leadflow-demo.com', password: 'demo123!', role: 'manager'   },
    { name: 'Sales Rep Demo',    email: 'sales@leadflow-demo.com',   password: 'demo123!', role: 'sales_rep' },
  ];

  const users = [];
  for (const d of defs) {
    const hash = await bcrypt.hash(d.password, 12);
    const u    = await User.create({ name: d.name, email: d.email, password: hash, role: d.role });
    users.push({ doc: u, plain: d.password });
  }
  console.log(`👥 Created ${users.length} demo users`);
  return users;
}

// ── Create leads ──────────────────────────────────────────────
async function createLeads(users) {
  const statuses = Lead.LEAD_STATUSES;
  const sources  = ['website','referral','social_media','paid_ads','cold_call','other'];
  const dist     = { New:0.25, Contacted:0.20, Qualified:0.15, Proposal:0.10, Won:0.15, Lost:0.15 };
  const leads    = [];

  for (let i = 0; i < 85; i++) {
    const owner = faker.helpers.arrayElement([
      users[2].doc, users[2].doc, users[2].doc, users[1].doc, users[0].doc
    ]);

    let r = Math.random(), cum = 0, status = 'New';
    for (const [s, w] of Object.entries(dist)) {
      cum += w;
      if (r <= cum) { status = s; break; }
    }

    const first = faker.person.firstName();
    const last  = faker.person.lastName();
    const co    = faker.company.name();
    const slug  = co.toLowerCase().replace(/[^a-z0-9]/g,'');

    const lead = await Lead.create({
      name:   `${first} ${last}`,
      email:  `${first.toLowerCase()}.${last.toLowerCase()}@${slug}.com`,
      phone:  faker.phone.number(),
      company: co,
      status,
      source: faker.helpers.arrayElement(sources),
      tags:   faker.helpers.arrayElements(['hot','vip','qualified','enterprise','smb'], { min:0, max:2 }),
      notes:  faker.datatype.boolean(0.6) ? faker.lorem.sentence() : '',
      owner:  owner._id,
      activities: [{ type:'created', content:'Lead created via seed', createdBy: owner._id }],
    });
    leads.push(lead);
  }

  const dist2 = {};
  statuses.forEach(s => { dist2[s] = leads.filter(l => l.status === s).length; });
  console.log(`📊 Created ${leads.length} leads:`, dist2);
  return leads;
}

// ── Create reminders ─────────────────────────────────────────
async function createReminders(users, leads) {
  const rems = [];
  for (let i = 0; i < 35; i++) {
    const lead  = faker.helpers.arrayElement(leads);
    const owner = users.find(u => u.doc._id.toString() === lead.owner.toString()) || users[2];
    const type  = faker.helpers.arrayElement(['past','today','near','future']);
    let dueDate;
    if (type === 'past')   dueDate = faker.date.recent({ days: 14 });
    else if (type === 'today')  dueDate = new Date();
    else if (type === 'near')   dueDate = faker.date.soon({ days: 7 });
    else                        dueDate = faker.date.soon({ days: 30 });

    const done = type === 'past' && faker.datatype.boolean(0.5);
    rems.push(await Reminder.create({
      title:       faker.helpers.arrayElement(['Follow up','Schedule demo','Send proposal','Check in']),
      dueDate,
      lead:        lead._id,
      owner:       owner.doc._id,
      completed:   done,
      completedAt: done ? new Date() : null,
    }));
  }
  console.log(`⏰ Created ${rems.length} reminders`);
  return rems;
}

// ── Write credentials file ────────────────────────────────────
function writeCredentials(users) {
  const lines = [
    '# LeadFlow CRM — Demo Credentials\n',
    '| Role | Email | Password |',
    '|------|-------|----------|',
    ...users.map(u => `| ${u.doc.role} | \`${u.doc.email}\` | \`${u.plain}\` |`),
    '',
    `Generated: ${new Date().toISOString()}`,
    `Database: ${mongoose.connection.name}`,
  ].join('\n');

  const outPath = path.join(__dirname, '..', 'DEMO_CREDENTIALS.md');
  fs.writeFileSync(outPath, lines);
  console.log(`📄 Credentials written to DEMO_CREDENTIALS.md`);
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 LeadFlow Seed — starting\n');
  const t0 = Date.now();

  await connect();
  await clearAll();

  const users    = await createUsers();
  const leads    = await createLeads(users);
  await createReminders(users, leads);
  writeCredentials(users);

  console.log(`\n✅ Done in ${((Date.now()-t0)/1000).toFixed(1)}s`);
  console.log('\nDemo logins:');
  users.forEach(u => console.log(`  ${u.doc.role.padEnd(10)} ${u.doc.email}  /  ${u.plain}`));

  await mongoose.disconnect();
}

async function reset() {
  console.log('\n🔄 LeadFlow Seed Reset\n');
  await connect();
  await clearAll();
  const out = path.join(__dirname, '..', 'DEMO_CREDENTIALS.md');
  if (fs.existsSync(out)) { fs.unlinkSync(out); console.log('🗑  Removed DEMO_CREDENTIALS.md'); }
  console.log('✅ Reset complete');
  await mongoose.disconnect();
}

const cmd = process.argv[2];
if (cmd === 'reset') reset().catch(e => { console.error(e.message); process.exit(1); });
else                 main().catch(e => { console.error(e.message); process.exit(1); });
