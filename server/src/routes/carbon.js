import express from 'express';
import { body, query, param } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import * as carbonController from '../controllers/carbonController.js';

const router = express.Router();

// Get user's carbon credits (protected)
router.get('/credits', authenticate, carbonController.getUserCarbonCredits);

// Get user stats
router.get('/stats', authenticate, carbonController.getUserStats);
router.get('/stats/:userId', carbonController.getUserStats);

// Leaderboard
router.get('/leaderboard', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('period').optional().isIn(['all', 'month', 'week']),
  validate,
], carbonController.getLeaderboard);

// Achievements
router.get('/achievements', optionalAuth, carbonController.getAchievements);
router.get('/achievements/user/:userId', carbonController.getUserAchievements);
router.get('/achievements/my', authenticate, carbonController.getUserAchievements);

// Rewards
router.get('/rewards', [
  query('category').optional().isIn(['discount', 'merchandise', 'service', 'donation', 'tree_planting']),
  validate,
], carbonController.getRewards);

// Redeem reward (protected)
router.post('/rewards/redeem', authenticate, [
  body('rewardId').notEmpty(),
  validate,
], carbonController.redeemReward);

// Get user's redemptions (protected)
router.get('/redemptions', authenticate, carbonController.getUserRedemptions);

// Purchase carbon offset (protected)
router.post('/offset/purchase', authenticate, [
  body('amountKg').isFloat({ min: 1 }),
  body('pricePaid').isFloat({ min: 0 }),
  body('offsetType').isIn(['tree_planting', 'renewable_energy', 'carbon_capture', 'mixed']),
  validate,
], carbonController.purchaseCarbonOffset);

// Plant trees (protected)
router.post('/trees/plant', authenticate, [
  body('treesPlanted').isInt({ min: 1 }),
  body('location').optional().trim(),
  body('partnerOrganization').optional().trim(),
  validate,
], carbonController.plantTrees);

// Corporate partners
router.get('/partners', carbonController.getCorporatePartners);

export default router;
