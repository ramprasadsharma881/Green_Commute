import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import db from '../database/db.js';
import { nanoid } from 'nanoid';

const router = express.Router();

// Create booking
router.post(
  '/',
  authenticate,
  [
    body('rideId').notEmpty(),
    body('seatsBooked').isInt({ min: 1 }),
    validate,
  ],
  (req, res) => {
    try {
      const { rideId, seatsBooked } = req.body;
      const passengerId = req.user.id;
      
      // Check if ride exists and has enough seats
      const ride = db.prepare('SELECT * FROM rides WHERE id = ? AND status = "active"').get(rideId);
      
      if (!ride) {
        return res.status(404).json({ success: false, error: 'Ride not found or not available' });
      }
      
      // Check available seats
      const bookedSeats = db.prepare('SELECT SUM(seats_booked) as total FROM bookings WHERE ride_id = ? AND status != "cancelled"').get(rideId);
      const availableSeats = ride.available_seats - (bookedSeats?.total || 0);
      
      if (availableSeats < seatsBooked) {
        return res.status(400).json({ success: false, error: 'Not enough seats available' });
      }
      
      // Create booking
      const bookingId = nanoid();
      const totalPrice = ride.price_per_seat * seatsBooked;
      
      db.prepare(`
        INSERT INTO bookings (id, ride_id, passenger_id, seats_booked, total_price)
        VALUES (?, ?, ?, ?, ?)
      `).run(bookingId, rideId, passengerId, seatsBooked, totalPrice);
      
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: { id: bookingId },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get user bookings
router.get('/my-bookings', authenticate, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT b.*, r.source, r.destination, r.date_time, r.vehicle_model, r.vehicle_color,
             u.name as driver_name, u.phone as driver_phone
      FROM bookings b
      JOIN rides r ON b.ride_id = r.id
      JOIN users u ON r.driver_id = u.id
      WHERE b.passenger_id = ?
      ORDER BY r.date_time DESC
    `).all(req.user.id);
    
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
