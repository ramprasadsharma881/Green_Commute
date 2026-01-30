import express from 'express';
import { param } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import db from '../database/db.js';

const router = express.Router();

// Get user profile
router.get('/:id', [param('id').notEmpty(), validate], (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, phone, photo, role, green_score, total_rides, co2_saved, rating, created_at
      FROM users WHERE id = ?
    `).get(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current user (authenticated)
router.get('/me', authenticate, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, phone, photo, role, green_score, total_rides, co2_saved, rating, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
