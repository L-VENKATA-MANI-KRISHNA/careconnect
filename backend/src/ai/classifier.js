const ServiceCategory = require('../models/ServiceCategory');

/**
 * Built-in deterministic classification rules for home service categories
 */
const CATEGORY_KEYWORDS = {
  'Plumbing': {
    keywords: ['leak', 'pipe', 'drain', 'toilet', 'faucet', 'sink', 'clog', 'water heater', 'sewage', 'burst', 'plumb'],
    skills: ['Pipe Fitting', 'Drain Cleaning', 'Leak Detection', 'Fixture Installation'],
  },
  'Electrical': {
    keywords: ['wire', 'spark', 'outlet', 'circuit', 'breaker', 'fuse', 'light', 'switch', 'power outage', 'shock', 'electric'],
    skills: ['Wiring', 'Circuit Breakers', 'Fixture Installation', 'Troubleshooting'],
  },
  'Cleaning': {
    keywords: ['clean', 'deep clean', 'sanitize', 'mop', 'vacuum', 'dust', 'disinfect', 'carpet', 'housekeeping', 'maid'],
    skills: ['Deep Cleaning', 'Sanitization', 'Carpet Cleaning', 'Move-out Cleaning'],
  },
  'Appliance Repair': {
    keywords: ['refrigerator', 'fridge', 'washer', 'dryer', 'dishwasher', 'oven', 'stove', 'microwave', 'appliance'],
    skills: ['Refrigeration Diagnostics', 'Motor Replacement', 'Appliance Calibration'],
  },
  'AC/Heating Maintenance': {
    keywords: ['ac', 'air conditioning', 'cooling', 'hvac', 'heater', 'furnace', 'thermostat', 'compressor', 'ventilation'],
    skills: ['HVAC Diagnostics', 'Refrigerant Recharge', 'Thermostat Calibration', 'Filter Replacement'],
  },
  'Carpentry': {
    keywords: ['wood', 'cabinet', 'door', 'frame', 'furniture', 'shelf', 'hinge', 'deck', 'carpenter'],
    skills: ['Woodworking', 'Cabinetry', 'Door Framing', 'Trim Carpentry'],
  },
  'Painting': {
    keywords: ['paint', 'drywall', 'primer', 'roller', 'coat', 'peeling', 'stain', 'wall color'],
    skills: ['Interior Painting', 'Exterior Painting', 'Drywall Patching', 'Surface Prep'],
  },
  'Pest Control': {
    keywords: ['bug', 'insect', 'cockroach', 'rat', 'mice', 'termite', 'ant', 'wasp', 'bedbug', 'fumigate'],
    skills: ['Extermination', 'Pest Inspection', 'Fumigation', 'Barrier Spray'],
  },
  'General Maintenance': {
    keywords: ['handyman', 'fix', 'install', 'mount', 'hang', 'drill', 'repair', 'assembly'],
    skills: ['Handyman Services', 'Wall Mounting', 'General Assembly'],
  },
};

/**
 * Determine urgency level from text
 */
const determineUrgency = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('emergency') || lower.includes('flood') || lower.includes('fire') || lower.includes('sparking') || lower.includes('gas') || lower.includes('burst pipe')) {
    return 'EMERGENCY';
  }
  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately') || lower.includes('today') || lower.includes('no power') || lower.includes('broken ac')) {
    return 'HIGH';
  }
  if (lower.includes('soon') || lower.includes('tomorrow') || lower.includes('this week')) {
    return 'MEDIUM';
  }
  return 'LOW';
};

/**
 * Deterministic Fallback Classifier
 */
const fallbackClassify = async (title = '', description = '') => {
  const combined = `${title} ${description}`.toLowerCase();
  let bestMatch = 'General Maintenance';
  let highestScore = 0;
  let matchedSkills = ['General Assembly', 'Handyman Services'];

  for (const [categoryName, data] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of data.keywords) {
      if (combined.includes(kw)) {
        score += 1;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = categoryName;
      matchedSkills = data.skills;
    }
  }

  // Calculate confidence based on keyword matches
  const confidence = highestScore > 0 ? Math.min(0.95, 0.65 + highestScore * 0.1) : 0.50;
  const urgency = determineUrgency(combined);

  // Lookup corresponding category ID in database if available
  const categoryDoc = await ServiceCategory.findOne({ name: bestMatch });

  return {
    categoryName: bestMatch,
    categoryId: categoryDoc?._id || null,
    requiredSkills: matchedSkills,
    urgency,
    confidence: Number(confidence.toFixed(2)),
    method: 'rule_based_engine',
  };
};

/**
 * Main Classifier with OpenAI integration and graceful fallback
 */
const classifyServiceRequest = async (title, description) => {
  if (!process.env.OPENAI_API_KEY) {
    // Graceful deterministic classification when OpenAI key is not configured
    return await fallbackClassify(title, description);
  }

  try {
    const prompt = `Classify the following home service request into exactly one of these categories:
Categories: Plumbing, Electrical, Cleaning, Appliance Repair, AC/Heating Maintenance, Carpentry, Painting, Pest Control, General Maintenance.

Request Title: "${title}"
Request Description: "${description}"

Respond ONLY with a valid JSON object in this exact schema:
{
  "category": "Category Name",
  "requiredSkills": ["Skill 1", "Skill 2"],
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY",
  "confidence": 0.95
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.warn(`[AI Warning] OpenAI returned status ${response.status}. Using fallback classifier.`);
      return await fallbackClassify(title, description);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    const parsed = JSON.parse(content);

    // Validate structured output
    if (!parsed.category || !Array.isArray(parsed.requiredSkills)) {
      throw new Error('Invalid AI response structure');
    }

    const categoryDoc = await ServiceCategory.findOne({ name: parsed.category });

    return {
      categoryName: parsed.category,
      categoryId: categoryDoc?._id || null,
      requiredSkills: parsed.requiredSkills,
      urgency: parsed.urgency || determineUrgency(`${title} ${description}`),
      confidence: parsed.confidence || 0.9,
      method: 'openai_llm',
    };
  } catch (err) {
    console.warn(`[AI Classifier Fallback] ${err.message}. Using deterministic fallback.`);
    return await fallbackClassify(title, description);
  }
};

module.exports = {
  classifyServiceRequest,
  fallbackClassify,
};
