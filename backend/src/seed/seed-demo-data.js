// Additive, repeatable demo fixtures for manual verification. Unlike seed.js,
// this script never deletes collections or existing users.
require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const {
  User, ProviderProfile, ServiceCategory, Skill, AvailabilitySlot,
  ServiceRequest, Quote, Booking, JobEvidence, Invoice, Review,
  Dispute, Notification, AuditLog, PricingRule,
} = require('../models');

const makePassword = () => `Cc!${crypto.randomBytes(15).toString('base64url')}7`;
const upsertUser = async ({ name, email, role, phone }) => {
  let user = await User.findOne({ email }).select('+passwordHash');
  let password = null;
  if (user) {
    user.name = name;
    user.role = role;
    user.phone = phone;
    user.isActive = true;
    user.authProvider = 'local';
    await user.save();
  } else {
    password = makePassword();
    const passwordHash = await User.hashPassword(password);
    user = await User.create({ name, email, role, phone, passwordHash, isActive: true, authProvider: 'local' });
  }
  return { user, password };
};

const getOrCreate = async (Model, query, data) => {
  let doc = await Model.findOne(query);
  if (!doc) doc = await Model.create(data);
  return doc;
};

async function seedDemoData() {
  await connectDB();
  if (mongoose.connection.readyState !== 1) throw new Error('MongoDB connection is unavailable');

  const customerAccount = await upsertUser({
    name: 'CareConnect Demo Customer', email: 'demo.customer@careconnect.local',
    role: 'CUSTOMER', phone: '+1 (555) 410-1001',
  });
  const providerAccount = await upsertUser({
    name: 'CareConnect Demo Provider', email: 'demo.provider@careconnect.local',
    role: 'SERVICE_PROVIDER', phone: '+1 (555) 410-1002',
  });
  const pendingAccount = await upsertUser({
    name: 'CareConnect Pending Provider', email: 'demo.pending-provider@careconnect.local',
    role: 'SERVICE_PROVIDER', phone: '+1 (555) 410-1003',
  });

  const category = await getOrCreate(ServiceCategory, { name: 'Plumbing' }, {
    name: 'Plumbing', description: 'Demo plumbing services for CareConnect verification.',
    icon: 'Droplet', requiredSkills: ['Leak Detection', 'Pipe Fitting'], basePrice: 65, isActive: true,
  });
  for (const name of ['Leak Detection', 'Pipe Fitting']) {
    await getOrCreate(Skill, { name, category: category._id }, {
      name, category: category._id, description: `${name} demo skill`, isActive: true,
    });
  }

  for (const [account, status, businessName] of [
    [providerAccount, 'APPROVED', 'CareConnect Demo Plumbing'],
    [pendingAccount, 'PENDING', 'CareConnect Pending Plumbing'],
  ]) {
    await ProviderProfile.findOneAndUpdate(
      { user: account.user._id },
      { $set: {
        businessName, bio: 'Demo profile used to verify provider and staff workflows.',
        serviceCategories: [category._id], skills: ['Leak Detection', 'Pipe Fitting'],
        serviceAreas: [{ city: 'San Francisco', zipCode: '94107', radiusMiles: 25 }],
        experienceYears: 5, verificationStatus: status, hourlyRate: 85,
        documents: [{ title: 'Demo trade license', fileUrl: '/uploads/demo-license.pdf', documentType: 'LICENSE' }],
      } },
      { new: true, upsert: true, runValidators: true }
    );
  }

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  await getOrCreate(AvailabilitySlot, {
    provider: providerAccount.user._id, date: tomorrow, startTime: '09:00', endTime: '12:00',
  }, { provider: providerAccount.user._id, date: tomorrow, startTime: '09:00', endTime: '12:00', status: 'AVAILABLE' });

  const openRequest = await getOrCreate(ServiceRequest, {
    customer: customerAccount.user._id, title: 'Demo request: kitchen pipe leak',
  }, {
    customer: customerAccount.user._id, category: category._id,
    title: 'Demo request: kitchen pipe leak',
    description: 'A slow leak under the kitchen sink. Please inspect the P-trap and replace worn seals.',
    location: { street: '123 Demo Street', city: 'San Francisco', state: 'CA', zipCode: '94107' },
    preferredDate: tomorrow, preferredTime: '09:00 - 12:00', urgency: 'MEDIUM', budget: 180,
    requiredSkills: ['Leak Detection', 'Pipe Fitting'],
    aiClassification: { predictedCategory: 'Plumbing', confidence: 0.95, extractedSkills: ['Leak Detection', 'Pipe Fitting'], urgency: 'MEDIUM', isAiClassified: true, classifiedAt: new Date() },
    status: 'OPEN',
  });

  const quotedRequest = await getOrCreate(ServiceRequest, {
    customer: customerAccount.user._id, title: 'Demo request: bathroom faucet repair',
  }, {
    customer: customerAccount.user._id, category: category._id,
    title: 'Demo request: bathroom faucet repair',
    description: 'Replace a worn faucet cartridge and check for leaks.',
    location: { street: '123 Demo Street', city: 'San Francisco', state: 'CA', zipCode: '94107' },
    preferredDate: dayAfter, preferredTime: '13:00 - 17:00', urgency: 'LOW', budget: 150,
    requiredSkills: ['Leak Detection'], status: 'QUOTING',
  });
  const pendingQuote = await getOrCreate(Quote, {
    serviceRequest: quotedRequest._id, provider: providerAccount.user._id,
  }, {
    serviceRequest: quotedRequest._id, provider: providerAccount.user._id,
    amount: 125, estimatedDuration: '90 minutes', message: 'Demo quote for faucet repair.',
    availableDate: dayAfter, availableTime: '13:00', status: 'PENDING',
  });

  const completedRequest = await getOrCreate(ServiceRequest, {
    customer: customerAccount.user._id, title: 'Demo completed request: drain repair',
  }, {
    customer: customerAccount.user._id, category: category._id,
    title: 'Demo completed request: drain repair',
    description: 'Completed demo job for invoice and review screens.',
    location: { street: '123 Demo Street', city: 'San Francisco', state: 'CA', zipCode: '94107' },
    preferredDate: tomorrow, preferredTime: '09:00 - 12:00', urgency: 'LOW', budget: 150,
    requiredSkills: ['Pipe Fitting'], status: 'COMPLETED', assignedProvider: providerAccount.user._id,
  });
  const acceptedQuote = await getOrCreate(Quote, {
    serviceRequest: completedRequest._id, provider: providerAccount.user._id,
  }, {
    serviceRequest: completedRequest._id, provider: providerAccount.user._id,
    amount: 120, estimatedDuration: '1 hour', message: 'Demo completed job quote.',
    availableDate: tomorrow, availableTime: '09:00', status: 'ACCEPTED',
  });
  completedRequest.selectedQuote = acceptedQuote._id;
  await completedRequest.save();
  const completedBooking = await getOrCreate(Booking, { quote: acceptedQuote._id }, {
    serviceRequest: completedRequest._id, customer: customerAccount.user._id,
    provider: providerAccount.user._id, quote: acceptedQuote._id,
    scheduledDate: tomorrow, startTime: '09:00', endTime: '10:00',
    address: completedRequest.location, status: 'COMPLETED',
    notes: 'Seeded demo booking.', completedAt: new Date(), customerConfirmedAt: new Date(),
  });
  await getOrCreate(Invoice, { booking: completedBooking._id }, {
    booking: completedBooking._id, customer: customerAccount.user._id,
    provider: providerAccount.user._id,
    items: [{ description: 'Demo drain repair', amount: 120 }],
    subtotal: 120, platformFee: 12, tax: 9.6, total: 141.6,
    status: 'PAID', issuedAt: new Date(), paidAt: new Date(),
  });
  await getOrCreate(Review, { booking: completedBooking._id }, {
    booking: completedBooking._id, customer: customerAccount.user._id,
    provider: providerAccount.user._id, rating: 5,
    comment: 'Demo review: prompt and professional service.', isVisible: true,
  });
  await getOrCreate(JobEvidence, { booking: completedBooking._id, type: 'AFTER' }, {
    booking: completedBooking._id, provider: providerAccount.user._id,
    type: 'AFTER', fileUrl: '/uploads/demo-completion.jpg', description: 'Demo completion evidence.',
  });

  const activeRequest = await getOrCreate(ServiceRequest, {
    customer: customerAccount.user._id, title: 'Demo active booking: pipe inspection',
  }, {
    customer: customerAccount.user._id, category: category._id,
    title: 'Demo active booking: pipe inspection',
    description: 'Active demo job for operations and booking dashboards.',
    location: { street: '123 Demo Street', city: 'San Francisco', state: 'CA', zipCode: '94107' },
    preferredDate: dayAfter, preferredTime: '10:00 - 12:00', urgency: 'MEDIUM', budget: 180,
    requiredSkills: ['Leak Detection'], status: 'BOOKED', assignedProvider: providerAccount.user._id,
  });
  let activeBooking = await Booking.findOne({ serviceRequest: activeRequest._id });
  if (!activeBooking) {
    const opsQuote = await getOrCreate(Quote, {
      serviceRequest: activeRequest._id, provider: providerAccount.user._id,
    }, {
      serviceRequest: activeRequest._id, provider: providerAccount.user._id,
      amount: 135, estimatedDuration: '2 hours', message: 'Demo quote for active operations flow.',
      availableDate: dayAfter, availableTime: '10:00', status: 'ACCEPTED',
    });
    activeRequest.selectedQuote = opsQuote._id;
    await activeRequest.save();
    activeBooking = await Booking.create({
      serviceRequest: activeRequest._id, customer: customerAccount.user._id,
      provider: providerAccount.user._id, quote: opsQuote._id,
      scheduledDate: dayAfter, startTime: '10:00', endTime: '12:00',
      address: activeRequest.location, status: 'CONFIRMED', notes: 'Demo active booking.',
    });
    await Invoice.create({
      booking: activeBooking._id, customer: customerAccount.user._id,
      provider: providerAccount.user._id,
      items: [{ description: 'Demo plumbing service', amount: 135 }],
      subtotal: 135, platformFee: 13.5, tax: 10.8, total: 159.3, status: 'PENDING',
    });
  }

  await getOrCreate(Dispute, { booking: completedBooking._id, reason: 'Demo service follow-up' }, {
    booking: completedBooking._id, raisedBy: customerAccount.user._id,
    reason: 'Demo service follow-up', description: 'Open demo ticket for support queue verification.',
    status: 'OPEN',
  });
  await getOrCreate(Notification, { user: customerAccount.user._id, title: 'Demo request is ready' }, {
    user: customerAccount.user._id, type: 'REQUEST_CREATED',
    title: 'Demo request is ready', message: 'This notification is a sample for inbox verification.',
    relatedEntity: { entityType: 'ServiceRequest', entityId: openRequest._id },
  });
  await getOrCreate(PricingRule, { category: category._id, ruleType: 'PERCENTAGE_FEE' }, {
    category: category._id, ruleType: 'PERCENTAGE_FEE', value: 10,
    minimumPrice: 65, maximumPrice: 2000, isActive: true,
  });
  await AuditLog.updateOne(
    { action: 'DEMO_DATA_CREATED', entityType: 'System' },
    { $setOnInsert: { actor: null, action: 'DEMO_DATA_CREATED', entityType: 'System', metadata: { purpose: 'role-feature-verification' }, ipAddress: '127.0.0.1' } },
    { upsert: true }
  );

  console.log(JSON.stringify({
    database: mongoose.connection.name,
    demoAccounts: [
      { email: customerAccount.user.email, id: customerAccount.user._id.toString(), role: 'CUSTOMER', password: customerAccount.password },
      { email: providerAccount.user.email, id: providerAccount.user._id.toString(), role: 'SERVICE_PROVIDER (approved)', password: providerAccount.password },
      { email: pendingAccount.user.email, id: pendingAccount.user._id.toString(), role: 'SERVICE_PROVIDER (pending)', password: pendingAccount.password },
    ],
    fixtures: { category: category.name, openRequest: openRequest._id.toString(), pendingQuote: pendingQuote._id.toString(), activeBooking: activeBooking._id.toString(), completedBooking: completedBooking._id.toString() },
  }));
}

seedDemoData()
  .then(() => mongoose.disconnect())
  .catch(async (error) => {
    console.error('[Demo seed error]', error.name, error.code || '', String(error.message).split('\n')[0]);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exitCode = 1;
  });
