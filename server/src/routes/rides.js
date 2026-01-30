import express from 'express';
import { body, query, param } from 'express-validator';
import * as rideController from '../controllers/rideController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Get all rides (with filters)
router.get(
  '/',
  [
    query('source').optional().trim(),
    query('destination').optional().trim(),
    query('date').optional().isISO8601(),
    query('seats').optional().isInt({ min: 1 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    validate,
  ],
  rideController.getAllRides
);

// Get single ride by ID
router.get(
  '/:id',
  [param('id').notEmpty(), validate],
  rideController.getRideById
);

// Create new ride (protected)
router.post(
  '/',
  authenticate,
  [
    body('source').notEmpty().trim(),
    body('destination').notEmpty().trim(),
    body('dateTime').notEmpty().isISO8601(),
    body('availableSeats').isInt({ min: 1, max: 7 }),
    body('pricePerSeat').isFloat({ min: 0 }),
    body('vehicleModel').notEmpty().trim(),
    body('vehicleColor').notEmpty().trim(),
    body('vehicleNumber').optional().trim(),
    body('distance').isFloat({ min: 0 }),
    body('duration').optional().isInt({ min: 0 }),
    body('waypoints').optional().isArray(),
    body('preferences').optional().isObject(),
    body('isLiveTrackingEnabled').optional().isBoolean(),
    validate,
  ],
  rideController.createRide
);

// Update ride (protected)
router.put(
  '/:id',
  authenticate,
  [
    param('id').notEmpty(),
    body('availableSeats').optional().isInt({ min: 1, max: 7 }),
    body('pricePerSeat').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['active', 'completed', 'cancelled']),
    validate,
  ],
  rideController.updateRide
);

// Delete ride (protected)
router.delete(
  '/:id',
  authenticate,
  [param('id').notEmpty(), validate],
  rideController.deleteRide
);

// Get rides by driver (protected)
router.get(
  '/driver/:driverId',
  [param('driverId').notEmpty(), validate],
  rideController.getRidesByDriver
);

// Search rides
router.post(
  '/search',
  [
    body('source').notEmpty().trim(),
    body('destination').notEmpty().trim(),
    body('date').optional().isISO8601(),
    body('seats').optional().isInt({ min: 1 }),
    validate,
  ],
  rideController.searchRides
);

// Update live location (protected)
router.post(
  '/:id/location',
  authenticate,
  [
    param('id').notEmpty(),
    body('latitude').isFloat(),
    body('longitude').isFloat(),
    body('speed').optional().isFloat(),
    body('heading').optional().isFloat(),
    validate,
  ],
  rideController.updateLiveLocation
);

// Get live location
router.get(
  '/:id/location',
  [param('id').notEmpty(), validate],
  rideController.getLiveLocation
);

export default router;
