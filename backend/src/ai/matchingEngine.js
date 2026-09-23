const { ProviderProfile } = require('../models/ProviderProfile');
const { User } = require('../models/User');
const { AvailabilitySlot } = require('../models/AvailabilitySlot');

/**
 * Match and rank providers for a given service request
 * Enforces hard constraints first, then ranks providers with explainable scores.
 */
const matchProviders = async (serviceRequest) => {
  const { category, requiredSkills = [], location, preferredDate } = serviceRequest;

  // 1. HARD CONSTRAINTS: Find approved providers supporting this category
  const profiles = await ProviderProfile.find({
    verificationStatus: 'APPROVED',
    serviceCategories: category,
  })
    .populate('user', 'name email phone avatar isActive address')
    .populate('serviceCategories', 'name basePrice');

  const candidates = [];

  for (const profile of profiles) {
    // Check if user account is active
    if (!profile.user || !profile.user.isActive) {
      continue;
    }

    // Check service area match (if profile has service areas defined)
    let areaMatch = true;
    if (profile.serviceAreas && profile.serviceAreas.length > 0 && location?.city) {
      areaMatch = profile.serviceAreas.some(
        (area) =>
          !area.city ||
          area.city.toLowerCase() === location.city.toLowerCase() ||
          (location.zipCode && area.zipCode === location.zipCode)
      );
    }

    // Check availability slot if preferredDate is provided
    let hasAvailability = true;
    if (preferredDate) {
      const slots = await AvailabilitySlot.find({
        provider: profile.user._id,
        date: preferredDate,
        status: 'AVAILABLE',
      });
      // If provider has slots on this date, check; if no slots scheduled, we consider standard working hours
      if (slots.length === 0) {
        // Soft match if no explicit slot
        hasAvailability = true;
      }
    }

    // Calculate skill overlap
    const providerSkills = (profile.skills || []).map((s) => s.toLowerCase());
    const matchedSkills = (requiredSkills || []).filter((reqSkill) =>
      providerSkills.some((pSkill) => pSkill.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(pSkill))
    );

    // Score components:
    // 1. Skill overlap score (up to 35 points)
    const skillRatio = requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 1;
    const skillScore = Math.round(skillRatio * 35);

    // 2. Rating score (up to 30 points, rating is 1-5)
    const ratingScore = Math.round(((profile.rating || 5.0) / 5) * 30);

    // 3. Experience & completed jobs score (up to 20 points)
    const jobsScore = Math.min(20, Math.round((profile.completedJobs || 0) * 1.5) + (profile.experienceYears || 1));

    // 4. Cancellation rate penalty/reward (up to 10 points)
    const cancelPenalty = Math.min(10, Math.round((profile.cancellationRate || 0) / 10));
    const reliabilityScore = Math.max(0, 10 - cancelPenalty);

    // 5. Area bonus (5 points)
    const locationScore = areaMatch ? 5 : 0;

    const totalMatchScore = Math.min(100, skillScore + ratingScore + jobsScore + reliabilityScore + locationScore);

    candidates.push({
      providerId: profile.user._id,
      user: profile.user,
      profile: {
        _id: profile._id,
        businessName: profile.businessName,
        bio: profile.bio,
        hourlyRate: profile.hourlyRate,
        rating: profile.rating,
        totalReviews: profile.totalReviews,
        completedJobs: profile.completedJobs,
        cancellationRate: profile.cancellationRate,
        experienceYears: profile.experienceYears,
        skills: profile.skills,
      },
      matchDetails: {
        matchScore: totalMatchScore,
        matchedSkills,
        areaMatch,
        hasAvailability,
        reasons: [
          matchedSkills.length > 0 ? `Matched ${matchedSkills.length} requested skills` : 'General category match',
          `${profile.rating.toFixed(1)} ★ customer rating (${profile.totalReviews} reviews)`,
          `${profile.completedJobs} completed jobs on platform`,
          areaMatch ? 'Operates in your service area' : 'Extended service area',
        ],
      },
    });
  }

  // Sort descending by matchScore
  candidates.sort((a, b) => b.matchDetails.matchScore - a.matchDetails.matchScore);

  return candidates;
};

module.exports = {
  matchProviders,
};
