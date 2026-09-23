require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const {
  User,
  ProviderProfile,
  ServiceCategory,
  Skill,
  AvailabilitySlot,
  ServiceRequest,
  Quote,
  Booking,
  JobEvidence,
  Invoice,
  Review,
  Dispute,
  Notification,
  AuditLog,
  PricingRule,
} = require('../models');

const DEFAULT_PASSWORD = 'Pass123!@#';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Skill.collection.dropIndexes().catch(() => {});
    await Promise.all([
      User.deleteMany({}),
      ProviderProfile.deleteMany({}),
      ServiceCategory.deleteMany({}),
      Skill.deleteMany({}),
      AvailabilitySlot.deleteMany({}),
      ServiceRequest.deleteMany({}),
      Quote.deleteMany({}),
      Booking.deleteMany({}),
      JobEvidence.deleteMany({}),
      Invoice.deleteMany({}),
      Review.deleteMany({}),
      Dispute.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      PricingRule.deleteMany({}),
    ]);

    const hashedPassword = await User.hashPassword(DEFAULT_PASSWORD);

    // 1. Create Categories
    console.log('[Seed] Creating Service Categories...');
    const categoryData = [
      {
        name: 'Plumbing',
        description: 'Leak repair, pipe replacement, drain cleaning, water heaters, and fixture installation.',
        icon: 'Droplet',
        basePrice: 65,
        requiredSkills: ['Pipe Fitting', 'Drain Cleaning', 'Leak Detection', 'Fixture Installation'],
      },
      {
        name: 'Electrical',
        description: 'Wiring, circuit breaker repair, outlet installation, lighting, and diagnostics.',
        icon: 'Zap',
        basePrice: 75,
        requiredSkills: ['Wiring', 'Circuit Breakers', 'Fixture Installation', 'Troubleshooting'],
      },
      {
        name: 'Cleaning',
        description: 'Residential deep cleaning, move-out cleaning, sanitization, and carpet care.',
        icon: 'Sparkles',
        basePrice: 50,
        requiredSkills: ['Deep Cleaning', 'Sanitization', 'Carpet Cleaning', 'Move-out Cleaning'],
      },
      {
        name: 'Appliance Repair',
        description: 'Diagnostics and repairs for refrigerators, washers, dryers, and ovens.',
        icon: 'Wrench',
        basePrice: 70,
        requiredSkills: ['Refrigeration Diagnostics', 'Motor Replacement', 'Appliance Calibration'],
      },
      {
        name: 'AC/Heating Maintenance',
        description: 'HVAC tune-ups, AC repair, thermostat replacement, and heating maintenance.',
        icon: 'Thermometer',
        basePrice: 80,
        requiredSkills: ['HVAC Diagnostics', 'Refrigerant Recharge', 'Thermostat Calibration', 'Filter Replacement'],
      },
      {
        name: 'Carpentry',
        description: 'Cabinet repair, door framing, custom shelving, trim, and woodworking.',
        icon: 'Hammer',
        basePrice: 60,
        requiredSkills: ['Woodworking', 'Cabinetry', 'Door Framing', 'Trim Carpentry'],
      },
      {
        name: 'Painting',
        description: 'Interior and exterior painting, drywall patching, priming, and staining.',
        icon: 'Paintbrush',
        basePrice: 55,
        requiredSkills: ['Interior Painting', 'Exterior Painting', 'Drywall Patching', 'Surface Prep'],
      },
      {
        name: 'Pest Control',
        description: 'Targeted pest elimination, termite inspections, barrier treatments, and fumigation.',
        icon: 'ShieldAlert',
        basePrice: 75,
        requiredSkills: ['Extermination', 'Pest Inspection', 'Fumigation', 'Barrier Spray'],
      },
      {
        name: 'General Maintenance',
        description: 'Handyman services, furniture assembly, TV wall mounting, and minor fixes.',
        icon: 'Tool',
        basePrice: 45,
        requiredSkills: ['Handyman Services', 'Wall Mounting', 'General Assembly'],
      },
    ];

    const categories = await ServiceCategory.insertMany(categoryData);
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.name] = cat;
    });

    // 2. Create Skills
    console.log('[Seed] Creating Skills...');
    const skillsToInsert = [];
    for (const cat of categories) {
      for (const skillName of cat.requiredSkills) {
        skillsToInsert.push({
          name: skillName,
          category: cat._id,
          description: `Certified ${skillName} specialist for ${cat.name}`,
          isActive: true,
        });
      }
    }
    await Skill.insertMany(skillsToInsert);

    // 3. Create Pricing Rules
    console.log('[Seed] Creating Pricing Rules...');
    const pricingRules = [
      {
        category: categoryMap['Plumbing']._id,
        ruleType: 'PERCENTAGE_FEE',
        value: 10,
        minimumPrice: 65,
        maximumPrice: 2000,
        isActive: true,
      },
      {
        category: categoryMap['Electrical']._id,
        ruleType: 'PERCENTAGE_FEE',
        value: 10,
        minimumPrice: 75,
        maximumPrice: 2500,
        isActive: true,
      },
      {
        category: categoryMap['AC/Heating Maintenance']._id,
        ruleType: 'PERCENTAGE_FEE',
        value: 10,
        minimumPrice: 80,
        maximumPrice: 3000,
        isActive: true,
      },
    ];
    await PricingRule.insertMany(pricingRules);

    // 4. Create Staff Accounts
    console.log('[Seed] Creating Staff Accounts...');
    const adminUser = await User.create({
      name: 'Platform Administrator',
      email: 'admin@careconnect.local',
      passwordHash: hashedPassword,
      role: 'PLATFORM_ADMIN',
      phone: '+1 (555) 010-0001',
      address: { street: '100 Market St', city: 'San Francisco', state: 'CA', zipCode: '94105' },
    });

    const opsUser = await User.create({
      name: 'Operations Dispatcher',
      email: 'operations@careconnect.local',
      passwordHash: hashedPassword,
      role: 'OPERATIONS_MANAGER',
      phone: '+1 (555) 010-0002',
      address: { street: '102 Market St', city: 'San Francisco', state: 'CA', zipCode: '94105' },
    });

    const supportUser1 = await User.create({
      name: 'Sarah Support Agent',
      email: 'support@careconnect.local',
      passwordHash: hashedPassword,
      role: 'SUPPORT_AGENT',
      phone: '+1 (555) 010-0003',
      address: { street: '104 Market St', city: 'San Francisco', state: 'CA', zipCode: '94105' },
    });

    const supportUser2 = await User.create({
      name: 'David Support Specialist',
      email: 'support2@careconnect.local',
      passwordHash: hashedPassword,
      role: 'SUPPORT_AGENT',
      phone: '+1 (555) 010-0004',
      address: { street: '106 Market St', city: 'San Francisco', state: 'CA', zipCode: '94105' },
    });

    // 5. Create 5 Customers
    console.log('[Seed] Creating 5 Customers...');
    const customerUsers = [];
    const customerProfilesData = [
      { name: 'Alex Johnson', email: 'customer1@careconnect.local', city: 'San Francisco', zip: '94107' },
      { name: 'Elena Rostova', email: 'customer2@careconnect.local', city: 'San Francisco', zip: '94110' },
      { name: 'Marcus Chen', email: 'customer3@careconnect.local', city: 'Oakland', zip: '94601' },
      { name: 'Olivia Williams', email: 'customer4@careconnect.local', city: 'Berkeley', zip: '94704' },
      { name: 'Liam Patel', email: 'customer5@careconnect.local', city: 'San Jose', zip: '95112' },
    ];

    for (const c of customerProfilesData) {
      const u = await User.create({
        name: c.name,
        email: c.email,
        passwordHash: hashedPassword,
        role: 'CUSTOMER',
        phone: `+1 (555) 200-${Math.floor(1000 + Math.random() * 9000)}`,
        address: { street: '123 Main St', city: c.city, state: 'CA', zipCode: c.zip },
      });
      customerUsers.push(u);
    }

    // 6. Create 10 Providers
    console.log('[Seed] Creating 10 Providers with Profiles...');
    const providerConfigs = [
      {
        name: 'Carlos Mendez',
        email: 'provider1@careconnect.local',
        business: 'Bay Area Master Plumbing',
        catNames: ['Plumbing'],
        skills: ['Pipe Fitting', 'Drain Cleaning', 'Leak Detection'],
        rate: 85,
        rating: 4.9,
        reviews: 28,
        jobs: 34,
        city: 'San Francisco',
        status: 'APPROVED',
      },
      {
        name: 'David Sparks',
        email: 'provider2@careconnect.local',
        business: 'Sparks Electric Pros',
        catNames: ['Electrical'],
        skills: ['Wiring', 'Circuit Breakers', 'Fixture Installation'],
        rate: 95,
        rating: 4.8,
        reviews: 22,
        jobs: 26,
        city: 'San Francisco',
        status: 'APPROVED',
      },
      {
        name: 'Maria Santos',
        email: 'provider3@careconnect.local',
        business: 'Pristine Eco Cleaners',
        catNames: ['Cleaning'],
        skills: ['Deep Cleaning', 'Sanitization', 'Move-out Cleaning'],
        rate: 55,
        rating: 5.0,
        reviews: 42,
        jobs: 50,
        city: 'San Francisco',
        status: 'APPROVED',
      },
      {
        name: 'Robert Vance',
        email: 'provider4@careconnect.local',
        business: 'Vance Appliance Specialists',
        catNames: ['Appliance Repair'],
        skills: ['Refrigeration Diagnostics', 'Motor Replacement'],
        rate: 80,
        rating: 4.7,
        reviews: 19,
        jobs: 24,
        city: 'Oakland',
        status: 'APPROVED',
      },
      {
        name: 'Ethan Frost',
        email: 'provider5@careconnect.local',
        business: 'CoolBreeze HVAC Care',
        catNames: ['AC/Heating Maintenance'],
        skills: ['HVAC Diagnostics', 'Refrigerant Recharge', 'Thermostat Calibration'],
        rate: 90,
        rating: 4.9,
        reviews: 31,
        jobs: 38,
        city: 'San Francisco',
        status: 'APPROVED',
      },
      {
        name: 'Lucas Wood',
        email: 'provider6@careconnect.local',
        business: 'Golden Gate Custom Carpentry',
        catNames: ['Carpentry'],
        skills: ['Woodworking', 'Cabinetry', 'Door Framing'],
        rate: 75,
        rating: 4.6,
        reviews: 15,
        jobs: 18,
        city: 'Berkeley',
        status: 'APPROVED',
      },
      {
        name: 'Angela Ramos',
        email: 'provider7@careconnect.local',
        business: 'ColorCraft Painting Studio',
        catNames: ['Painting'],
        skills: ['Interior Painting', 'Exterior Painting', 'Drywall Patching'],
        rate: 65,
        rating: 4.8,
        reviews: 18,
        jobs: 22,
        city: 'San Francisco',
        status: 'APPROVED',
      },
      {
        name: 'Gregory Roach',
        email: 'provider8@careconnect.local',
        business: 'BioShield Pest Elimination',
        catNames: ['Pest Control'],
        skills: ['Extermination', 'Pest Inspection', 'Barrier Spray'],
        rate: 85,
        rating: 4.9,
        reviews: 25,
        jobs: 30,
        city: 'San Jose',
        status: 'APPROVED',
      },
      {
        name: 'Sam Fixit',
        email: 'provider9@careconnect.local',
        business: 'All-Round Home Handyman',
        catNames: ['General Maintenance', 'Carpentry'],
        skills: ['Handyman Services', 'Wall Mounting', 'General Assembly'],
        rate: 55,
        rating: 4.7,
        reviews: 14,
        jobs: 17,
        city: 'San Francisco',
        status: 'APPROVED',
      },
      {
        name: 'Newcomer Rick',
        email: 'provider10@careconnect.local',
        business: 'Apex Express Repairs',
        catNames: ['Plumbing', 'General Maintenance'],
        skills: ['Pipe Fitting', 'Handyman Services'],
        rate: 60,
        rating: 5.0,
        reviews: 0,
        jobs: 0,
        city: 'San Francisco',
        status: 'PENDING', // Pending verification for admin flow testing!
      },
    ];

    const providerUsers = [];
    const providerProfiles = [];

    for (const p of providerConfigs) {
      const u = await User.create({
        name: p.name,
        email: p.email,
        passwordHash: hashedPassword,
        role: 'SERVICE_PROVIDER',
        phone: `+1 (555) 300-${Math.floor(1000 + Math.random() * 9000)}`,
        address: { street: '456 Service Blvd', city: p.city, state: 'CA', zipCode: '94107' },
      });
      providerUsers.push(u);

      const catIds = p.catNames.map((name) => categoryMap[name]._id);
      const prof = await ProviderProfile.create({
        user: u._id,
        businessName: p.business,
        bio: `Professional service provider with over 8 years of certified local trade experience in ${p.catNames.join(', ')}.`,
        serviceCategories: catIds,
        skills: p.skills,
        serviceAreas: [
          { city: p.city, zipCode: '94107', radiusMiles: 30 },
          { city: 'Oakland', zipCode: '94601', radiusMiles: 20 },
        ],
        experienceYears: 8,
        verificationStatus: p.status,
        verificationNotes: p.status === 'APPROVED' ? 'Verified trade license and active insurance on file.' : '',
        hourlyRate: p.rate,
        rating: p.rating,
        totalReviews: p.reviews,
        completedJobs: p.jobs,
        cancellationRate: 2,
        documents: [
          {
            title: 'Master Trade Contractor License',
            fileUrl: '/uploads/sample-license.pdf',
            documentType: 'LICENSE',
          },
        ],
      });
      providerProfiles.push(prof);
    }

    // 7. Create Availability Slots for approved providers
    console.log('[Seed] Creating Availability Slots...');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];

    for (const pUser of providerUsers.slice(0, 9)) {
      await AvailabilitySlot.insertMany([
        { provider: pUser._id, date: today, startTime: '09:00', endTime: '12:00', status: 'AVAILABLE' },
        { provider: pUser._id, date: today, startTime: '13:00', endTime: '17:00', status: 'AVAILABLE' },
        { provider: pUser._id, date: tomorrow, startTime: '09:00', endTime: '12:00', status: 'AVAILABLE' },
        { provider: pUser._id, date: tomorrow, startTime: '13:00', endTime: '17:00', status: 'AVAILABLE' },
        { provider: pUser._id, date: dayAfter, startTime: '10:00', endTime: '16:00', status: 'AVAILABLE' },
      ]);
    }

    // 8. Create Service Requests across various lifecycle stages
    console.log('[Seed] Creating Service Requests...');
    // Request 1: OPEN - AC Repair
    const req1 = await ServiceRequest.create({
      customer: customerUsers[0]._id,
      category: categoryMap['AC/Heating Maintenance']._id,
      title: 'AC is not cooling the master bedroom',
      description: 'The AC unit blows room-temperature air when set to 68 degrees. Need quick diagnosis and refrigerant check.',
      location: { street: '742 Evergreen Terrace', city: 'San Francisco', state: 'CA', zipCode: '94107' },
      preferredDate: tomorrow,
      preferredTime: 'Morning (09:00 - 12:00)',
      urgency: 'HIGH',
      budget: 200,
      aiClassification: {
        predictedCategory: 'AC/Heating Maintenance',
        confidence: 0.94,
        extractedSkills: ['HVAC Diagnostics', 'Refrigerant Recharge'],
        urgency: 'HIGH',
        isAiClassified: true,
        classifiedAt: new Date(),
      },
      requiredSkills: ['HVAC Diagnostics', 'Refrigerant Recharge'],
      status: 'OPEN',
    });

    // Request 2: QUOTING - Plumbing
    const req2 = await ServiceRequest.create({
      customer: customerUsers[1]._id,
      category: categoryMap['Plumbing']._id,
      title: 'Kitchen sink pipe leaking under the cabinet',
      description: 'Slow continuous drip from the P-trap joint under the kitchen sink. Water accumulating in collection bowl.',
      location: { street: '1200 Market St', city: 'San Francisco', state: 'CA', zipCode: '94110' },
      preferredDate: dayAfter,
      preferredTime: 'Afternoon (13:00 - 17:00)',
      urgency: 'MEDIUM',
      budget: 150,
      aiClassification: {
        predictedCategory: 'Plumbing',
        confidence: 0.96,
        extractedSkills: ['Leak Detection', 'Pipe Fitting'],
        urgency: 'MEDIUM',
        isAiClassified: true,
        classifiedAt: new Date(),
      },
      requiredSkills: ['Leak Detection', 'Pipe Fitting'],
      status: 'QUOTING',
    });

    // Request 3: COMPLETED - Cleaning
    const req3 = await ServiceRequest.create({
      customer: customerUsers[2]._id,
      category: categoryMap['Cleaning']._id,
      title: 'Full 2-Bedroom Apartment Move-Out Deep Clean',
      description: 'Need complete deep clean including oven interior, refrigerator, baseboards, and carpet sanitization.',
      location: { street: '500 Grand Ave', city: 'Oakland', state: 'CA', zipCode: '94601' },
      preferredDate: today,
      preferredTime: '09:00 - 13:00',
      urgency: 'MEDIUM',
      budget: 250,
      aiClassification: {
        predictedCategory: 'Cleaning',
        confidence: 0.98,
        extractedSkills: ['Deep Cleaning', 'Sanitization', 'Move-out Cleaning'],
        urgency: 'MEDIUM',
        isAiClassified: true,
        classifiedAt: new Date(),
      },
      requiredSkills: ['Deep Cleaning', 'Sanitization', 'Move-out Cleaning'],
      status: 'COMPLETED',
      assignedProvider: providerUsers[2]._id,
    });

    // 9. Quotes for Request 2 (Plumbing)
    console.log('[Seed] Creating Quotes...');
    const quote1 = await Quote.create({
      serviceRequest: req2._id,
      provider: providerUsers[0]._id, // Carlos Mendez
      amount: 140,
      estimatedDuration: '1.5 hours',
      message: 'I have replacement P-trap seals and fittings on my truck. Can fix it cleanly on Thursday afternoon.',
      availableDate: dayAfter,
      availableTime: '14:00',
      status: 'PENDING',
    });

    // 10. Completed Booking, Evidence, Invoice, and Review for Request 3 (Cleaning)
    console.log('[Seed] Creating Booking, Evidence, Invoice, and Review...');
    const quote3 = await Quote.create({
      serviceRequest: req3._id,
      provider: providerUsers[2]._id, // Maria Santos
      amount: 220,
      estimatedDuration: '4 hours',
      message: 'Professional two-person cleaning crew using eco-friendly hospital-grade sanitizers.',
      availableDate: today,
      availableTime: '09:00',
      status: 'ACCEPTED',
    });

    req3.selectedQuote = quote3._id;
    await req3.save();

    const booking3 = await Booking.create({
      serviceRequest: req3._id,
      customer: customerUsers[2]._id,
      provider: providerUsers[2]._id,
      quote: quote3._id,
      scheduledDate: today,
      startTime: '09:00',
      endTime: '13:00',
      address: req3.location,
      status: 'COMPLETED',
      notes: 'Apartment move-out inspection clean.',
      completedAt: new Date(),
      customerConfirmedAt: new Date(),
    });

    // Evidence
    await JobEvidence.insertMany([
      {
        booking: booking3._id,
        provider: providerUsers[2]._id,
        type: 'BEFORE',
        fileUrl: '/uploads/sample-before.jpg',
        description: 'Living room and kitchen prior to deep sanitation',
      },
      {
        booking: booking3._id,
        provider: providerUsers[2]._id,
        type: 'AFTER',
        fileUrl: '/uploads/sample-after.jpg',
        description: 'Fully scrubbed, sanitized, and vacuumed space ready for move-out',
      },
    ]);

    // Invoice
    const invoice3 = await Invoice.create({
      booking: booking3._id,
      customer: customerUsers[2]._id,
      provider: providerUsers[2]._id,
      items: [{ description: 'Full Apartment Move-out Deep Clean', amount: 220 }],
      subtotal: 220,
      platformFee: 22.0,
      tax: 17.6,
      total: 259.6,
      status: 'PAID',
      issuedAt: new Date(),
      paidAt: new Date(),
    });

    // Review
    await Review.create({
      booking: booking3._id,
      customer: customerUsers[2]._id,
      provider: providerUsers[2]._id,
      rating: 5,
      comment: 'Maria and her team did an absolutely phenomenal job! Passed the landlord move-out walkthrough with zero deductions.',
      response: 'Thank you Marcus! It was a pleasure working with you.',
      isVisible: true,
    });

    // 11. Initial Notifications & Audit Logs
    console.log('[Seed] Creating Notifications and Audit Logs...');
    await Notification.insertMany([
      {
        user: customerUsers[0]._id,
        type: 'REQUEST_CREATED',
        title: 'Service Request Created',
        message: 'Your AC repair request is active and open for matching providers.',
        relatedEntity: { entityType: 'ServiceRequest', entityId: req1._id },
      },
      {
        user: customerUsers[1]._id,
        type: 'NEW_QUOTE',
        title: 'New Quote from Bay Area Master Plumbing',
        message: 'Carlos Mendez submitted a quote of $140 for your plumbing request.',
        relatedEntity: { entityType: 'Quote', entityId: quote1._id },
      },
    ]);

    await AuditLog.insertMany([
      {
        actor: adminUser._id,
        action: 'PLATFORM_SEEDED',
        entityType: 'System',
        metadata: { version: '1.0.0', seedDate: new Date() },
        ipAddress: '127.0.0.1',
      },
    ]);

    console.log('[Seed] Database successfully seeded with full realistic dataset!');
    console.log('-------------------------------------------------------------');
    console.log('Demo Credentials (Password: Pass123!@#):');
    console.log('Admin:       admin@careconnect.local');
    console.log('Operations:  operations@careconnect.local');
    console.log('Support:     support@careconnect.local');
    console.log('Customer:    customer1@careconnect.local');
    console.log('Provider:    provider1@careconnect.local (Approved)');
    console.log('Provider:    provider10@careconnect.local (Pending Verification)');
    console.log('-------------------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
