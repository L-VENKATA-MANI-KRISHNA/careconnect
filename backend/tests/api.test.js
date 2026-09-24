const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');

let server;
let baseUrl;

before(async () => {
  await connectDB();
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.connection.close();
});

describe('CareConnect Backend Test Suite', () => {
  let customerToken = '';
  let providerToken = '';
  let adminToken = '';
  let categoryId = '';
  let serviceRequestId = '';
  let quoteId = '';
  let bookingId = '';

  test('1. Health check returns 200 and healthy database status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.database, 'connected');
  });

  test('2. Admin login succeeds with demo credentials', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@careconnect.local',
        password: 'Pass123!@#',
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.user.role, 'PLATFORM_ADMIN');
    adminToken = json.data.accessToken;
    assert.ok(adminToken);
  });

  test('3. Customer login succeeds with demo credentials', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer1@careconnect.local',
        password: 'Pass123!@#',
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.user.role, 'CUSTOMER');
    customerToken = json.data.accessToken;
  });

  test('4. Provider login succeeds and returns approved profile', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'provider1@careconnect.local',
        password: 'Pass123!@#',
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.user.role, 'SERVICE_PROVIDER');
    assert.ok(json.data.providerProfile);
    assert.strictEqual(json.data.providerProfile.verificationStatus, 'APPROVED');
    providerToken = json.data.accessToken;
  });

  test('5. Categories can be fetched and Plumbing category exists', async () => {
    const res = await fetch(`${baseUrl}/categories`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.length > 0);
    const plumbing = json.data.find((c) => c.name === 'Plumbing');
    assert.ok(plumbing);
    categoryId = plumbing._id;
  });

  test('6. AI Service Request Classification returns structured predictions with fallback', async () => {
    const res = await fetch(`${baseUrl}/ai/classify-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Water pipe burst in the basement',
        description: 'Flooding in basement from ruptured main pipe under the stairs. Need emergency shutoff and pipe replacement.',
      }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.categoryName, 'Plumbing');
    assert.strictEqual(json.data.urgency, 'EMERGENCY');
    assert.ok(Array.isArray(json.data.requiredSkills));
    assert.ok(json.data.requiredSkills.length > 0);
    assert.ok(['groq_llm', 'openai_llm', 'rule_based_engine'].includes(json.data.method));
  });

  test('7. Customer creates a new Service Request', async () => {
    const res = await fetch(`${baseUrl}/service-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        title: 'Kitchen faucet dripping heavily',
        description: 'Continuous dripping faucet causing water buildup. Need washer replacement and cartridge inspection.',
        categoryId,
        location: {
          street: '123 Market St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94107',
        },
        preferredDate: '2026-10-15',
        preferredTime: '10:00 - 12:00',
        urgency: 'MEDIUM',
        budget: 120,
      }),
    });
    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.status, 'OPEN');
    assert.ok(json.data.aiClassification);
    serviceRequestId = json.data._id;
  });

  test('8. Matching Engine identifies verified providers for request', async () => {
    const res = await fetch(`${baseUrl}/ai/match-providers/${serviceRequestId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.providers.length > 0);
    const firstMatch = json.data.providers[0];
    assert.ok(firstMatch.matchDetails.matchScore > 50);
  });

  test('9. Verified Provider submits a Quote for the request', async () => {
    const res = await fetch(`${baseUrl}/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({
        serviceRequestId,
        amount: 110,
        estimatedDuration: '1 hour',
        message: 'I have OEM replacement cartridges and seals on hand.',
        availableDate: '2026-10-15',
        availableTime: '10:00',
      }),
    });
    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.status, 'PENDING');
    quoteId = json.data._id;
  });

  test('10. Customer accepts Quote, creating Booking and generating Invoice', async () => {
    const res = await fetch(`${baseUrl}/bookings/accept-quote/${quoteId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ notes: 'Please ring front doorbell.' }),
    });
    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.booking.status, 'CONFIRMED');
    assert.ok(json.data.invoice);
    assert.strictEqual(json.data.invoice.subtotal, 110);
    bookingId = json.data.booking._id;
  });

  test('11. Availability Conflict Detection rejects overlapping booking for provider', async () => {
    // Attempt to accept another booking for the same provider at the exact same time
    // Let's create another request and quote for the same window
    const reqRes = await fetch(`${baseUrl}/service-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        title: 'Secondary plumbing job',
        description: 'Another test fixture installation.',
        categoryId,
        location: { street: '125 Market St', city: 'San Francisco', zipCode: '94107' },
        preferredDate: '2026-10-15',
      }),
    });
    const reqJson = await reqRes.json();
    const secondReqId = reqJson.data._id;

    const quoteRes = await fetch(`${baseUrl}/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({
        serviceRequestId: secondReqId,
        amount: 95,
        availableDate: '2026-10-15',
        availableTime: '10:30', // Overlaps 10:00 - 12:00
      }),
    });
    const quoteJson = await quoteRes.json();
    const secondQuoteId = quoteJson.data._id;

    // Customer attempts to accept overlapping quote
    const acceptRes = await fetch(`${baseUrl}/bookings/accept-quote/${secondQuoteId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
    });
    assert.strictEqual(acceptRes.status, 409); // Conflict HTTP 409
    const acceptJson = await acceptRes.json();
    assert.strictEqual(acceptJson.errorCode, 'BOOKING_CONFLICT');
  });

  test('12. Provider advances job lifecycle to IN_PROGRESS and then COMPLETED_PENDING_CONFIRMATION', async () => {
    // Step A: PROVIDER_ON_THE_WAY
    let res = await fetch(`${baseUrl}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({ status: 'PROVIDER_ON_THE_WAY' }),
    });
    assert.strictEqual(res.status, 200);

    // Step B: IN_PROGRESS
    res = await fetch(`${baseUrl}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    assert.strictEqual(res.status, 200);

    // Step C: COMPLETED_PENDING_CONFIRMATION
    res = await fetch(`${baseUrl}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerToken}`,
      },
      body: JSON.stringify({ status: 'COMPLETED_PENDING_CONFIRMATION' }),
    });
    assert.strictEqual(res.status, 200);
  });

  test('13. Customer confirms completion, finalizing invoice and enabling reviews', async () => {
    const res = await fetch(`${baseUrl}/bookings/${bookingId}/confirm-completion`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.data.status, 'COMPLETED');
  });

  test('14. Customer submits Review and duplicate review is rejected', async () => {
    // First review
    const res = await fetch(`${baseUrl}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        bookingId,
        rating: 5,
        comment: 'Great, timely work on the faucet!',
      }),
    });
    assert.strictEqual(res.status, 201);

    // Duplicate review attempt for same booking
    const dupRes = await fetch(`${baseUrl}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        bookingId,
        rating: 4,
        comment: 'Trying to review again.',
      }),
    });
    assert.strictEqual(dupRes.status, 409); // Conflict
  });

  test('15. Admin Analytics returns real calculated statistics', async () => {
    const res = await fetch(`${baseUrl}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.users.totalUsers >= 18);
    assert.ok(json.data.bookings.completedBookings >= 2);
    assert.ok(json.data.revenue.totalRevenue > 0);
  });

  test('16. Role Authorization protects Admin routes from Customer access', async () => {
    const res = await fetch(`${baseUrl}/admin/analytics`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.strictEqual(json.errorCode, 'ROLE_FORBIDDEN');
  });
});
