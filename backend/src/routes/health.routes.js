const express = require('express');
const mongoose = require('mongoose');
const { sendSuccess } = require('../utils/response');

const router = express.Router();

router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const healthData = {
    service: 'CareConnect API',
    status: dbState === 1 ? 'healthy' : 'degraded',
    database: dbStatusMap[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
  };

  return sendSuccess(res, 'CareConnect API health status', healthData, dbState === 1 ? 200 : 503);
});

module.exports = router;
