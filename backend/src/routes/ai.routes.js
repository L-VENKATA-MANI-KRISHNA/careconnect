const express = require('express');
const { classifyRequest, getMatchingProviders } = require('../controllers/ai.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/classify-request', classifyRequest);
router.get('/match-providers/:requestId', requireAuth, getMatchingProviders);

module.exports = router;
