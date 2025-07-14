// gdi.route.ts
// Quantum-detailed: Express route for GDIService API endpoints.
// Provides balance, tier, and access gate queries for external systems (Unity, VRChat, web, etc).
//
// Endpoints:
//   GET /balance/:address      - Returns GDI balance for address
//   GET /tier/:address         - Returns GDI tier for address
//   GET /can-access/:address/:requiredTier - Returns access check for address/tier
//
// Usage: Mount in main Express app (see gateway.ts)

import express from 'express';
import GDIService from '../../gdi-service/GDIService';
import { GDITier } from '../../gdi-service/GDITier';
import authMiddleware from '../auth.middleware';

const router = express.Router();

// GET /balance/:address
router.get('/balance/:address', authMiddleware, async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await GDIService.getBalance(address);
    res.json({ address, balance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch balance', details: err?.message });
  }
});

// GET /tier/:address
router.get('/tier/:address', authMiddleware, async (req, res) => {
  try {
    const { address } = req.params;
    const tier = await GDIService.getTier(address);
    res.json({ address, tier });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tier', details: err?.message });
  }
});

// GET /can-access/:address/:requiredTier
router.get('/can-access/:address/:requiredTier', authMiddleware, async (req, res) => {
  try {
    const { address, requiredTier } = req.params;
    if (!Object.values(GDITier).includes(requiredTier as GDITier)) {
      return res.status(400).json({ error: 'Invalid requiredTier' });
    }
    const canAccess = await GDIService.canAccess(address, requiredTier as GDITier);
    res.json({ address, requiredTier, canAccess });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check access', details: err?.message });
  }
});

export default router; 