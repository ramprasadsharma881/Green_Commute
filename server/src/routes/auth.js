import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Register
router.post(
  '/register',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('phone').optional().trim(),
    body('role').optional().isIn(['driver', 'passenger', 'both']),
    validate,
  ],
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate,
  ],
  authController.login
);

export default router;
