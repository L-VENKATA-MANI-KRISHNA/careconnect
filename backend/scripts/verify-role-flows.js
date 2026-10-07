// Live smoke check for demo records. Provide the three staff passwords and
// demo customer/provider passwords via environment variables before running.
require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');

const credentials = [
  ['admin', 'admin@careconnect.local', process.env.DEMO_ADMIN_PASSWORD],
  ['operations', 'operations@careconnect.local', process.env.DEMO_OPERATIONS_PASSWORD],
  ['support', 'support@careconnect.local', process.env.DEMO_SUPPORT_PASSWORD],
  ['customer', 'demo.customer@careconnect.local', process.env.DEMO_CUSTOMER_PASSWORD],
  ['provider', 'demo.provider@careconnect.local', process.env.DEMO_PROVIDER_PASSWORD],
];

const assertStatus = (response, expected, name) => {
  if (response.status !== expected) {
    throw new Error(`${name}: expected HTTP ${expected}; got ${response.status}: ${JSON.stringify(response.body)}`);
  }
};

async function run() {
  if (credentials.some(([, , password]) => !password)) {
    throw new Error('Set DEMO_ADMIN_PASSWORD, DEMO_OPERATIONS_PASSWORD, DEMO_SUPPORT_PASSWORD, DEMO_CUSTOMER_PASSWORD, and DEMO_PROVIDER_PASSWORD.');
  }
  const connection = await connectDB();
  if (!connection) throw new Error('Could not connect to MongoDB.');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const checks = [];
  const tokens = {};
  const call = async (method, path, token, body, expected = 200) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const parsed = await response.json();
    assertStatus({ status: response.status, body: parsed }, expected, `${method} ${path}`);
    checks.push(`${method} ${path} -> ${response.status}`);
    return parsed;
  };

  try {
    await call('GET', '/health', null);
    for (const [key, email, password] of credentials) {
      const result = await call('POST', '/auth/login', null, { email, password }, 200);
      tokens[key] = result.data.accessToken;
      await call('GET', '/auth/me', tokens[key]);
    }

    const adminPaths = ['/admin/analytics', '/admin/users', '/admin/audit-logs', '/admin/pricing', '/providers/admin/pending'];
    for (const path of adminPaths) await call('GET', path, tokens.admin);
    await call('GET', '/operations/dashboard-summary', tokens.operations);
    await call('GET', '/operations/unassigned-requests', tokens.operations);
    await call('GET', '/support/dashboard-summary', tokens.support);
    await call('GET', '/disputes', tokens.support);
    for (const path of ['/providers/me/profile', '/quotes/me', '/availability/me', '/bookings', '/invoices']) {
      await call('GET', path, tokens.provider);
    }
    for (const path of ['/categories', '/skills', '/providers', '/service-requests', '/bookings', '/invoices', '/notifications', '/disputes']) {
      await call('GET', path, tokens.customer);
    }
    await call('GET', '/admin/analytics', tokens.customer, undefined, 403);

    const categoryResponse = await call('GET', '/categories', null);
    const categories = categoryResponse.data?.data || categoryResponse.data || [];
    if (!categories.length) throw new Error('No category fixture was returned.');
    const categoryId = categories[0]._id;
    const serviceDate = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    const requestBody = (title) => ({
      title, description: 'Role verification flow: repair a leaking kitchen pipe fitting.',
      categoryId,
      location: { street: '123 Demo Street', city: 'San Francisco', state: 'CA', zipCode: '94107' },
      preferredDate: serviceDate, preferredTime: '10:00 - 12:00', urgency: 'MEDIUM', budget: 180,
    });

    const quoteRequest = await call('POST', '/service-requests', tokens.customer, requestBody(`Role flow quote ${Date.now()}`), 201);
    const requestId = quoteRequest.data._id;
    await call('GET', `/service-requests/${requestId}`, tokens.customer);
    await call('GET', `/ai/match-providers/${requestId}`, tokens.customer);
    const quote = await call('POST', '/quotes', tokens.provider, {
      serviceRequestId: requestId, amount: 140, estimatedDuration: '2 hours',
      message: 'Demo role-flow quote.', availableDate: serviceDate, availableTime: '10:00',
    }, 201);
    await call('GET', `/quotes/request/${requestId}`, tokens.customer);
    const bookingResult = await call('POST', `/bookings/accept-quote/${quote.data._id}`, tokens.customer, { notes: 'Role verification booking.' }, 201);
    const bookingId = bookingResult.data.booking._id;
    const invoiceId = bookingResult.data.invoice._id;
    await call('GET', `/bookings/${bookingId}`, tokens.customer);
    await call('POST', `/invoices/${invoiceId}/pay`, tokens.customer);
    for (const status of ['PROVIDER_ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED_PENDING_CONFIRMATION']) {
      await call('PATCH', `/bookings/${bookingId}/status`, tokens.provider, { status });
    }
    await call('POST', `/bookings/${bookingId}/confirm-completion`, tokens.customer);
    const review = await call('POST', '/reviews', tokens.customer, {
      bookingId, rating: 5, comment: 'Role verification flow completed successfully.',
    }, 201);
    const providerProfile = await mongoose.model('ProviderProfile').findOne({ user: (await mongoose.model('User').findOne({ email: 'demo.provider@careconnect.local' }).select('_id'))._id }).select('_id user');
    await call('GET', `/reviews/provider/${providerProfile.user}`, null);
    await call('GET', `/providers/${providerProfile._id}`, null);
    const slotDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const slot = await call('POST', '/availability/me', tokens.provider, { date: slotDate, startTime: '18:00', endTime: '19:00' }, 201);
    await call('DELETE', `/availability/me/${slot.data._id}`, tokens.provider);

    const pendingProfile = await mongoose.model('ProviderProfile').findOne({ verificationStatus: 'PENDING' }).select('_id');
    if (pendingProfile) {
      await call('PATCH', `/providers/admin/verify/${pendingProfile._id}`, tokens.admin, { status: 'APPROVED', notes: 'Verification route smoke check.' });
      await call('PATCH', `/providers/admin/verify/${pendingProfile._id}`, tokens.admin, { status: 'PENDING', notes: 'Restored demo pending state.' });
    }

    const opsRequest = await call('POST', '/service-requests', tokens.customer, requestBody(`Role flow dispatch ${Date.now()}`), 201);
    const providerUser = await mongoose.model('User').findOne({ email: 'demo.provider@careconnect.local' }).select('_id');
    await call('POST', '/operations/assign-provider', tokens.operations, { requestId: opsRequest.data._id, providerId: providerUser._id.toString() });
    const dispute = await call('POST', '/disputes', tokens.customer, {
      bookingId, reason: 'Role verification follow-up', description: 'Demo support workflow check.',
    }, 201);
    await call('PATCH', `/disputes/${dispute.data._id}/assign`, tokens.support, {});
    await call('POST', `/disputes/${dispute.data._id}/resolve`, tokens.support, {
      status: 'RESOLVED', resolution: 'Resolved as part of the role workflow verification.', refundAmount: 0,
    });

    console.log(JSON.stringify({ result: 'passed', database: mongoose.connection.name, checks: checks.length, reviewId: review.data._id, checks }, null, 2));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error('ROLE_FLOW_CHECK_FAILED', error.message);
  process.exitCode = 1;
});
