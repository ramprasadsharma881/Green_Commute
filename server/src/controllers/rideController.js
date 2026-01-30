import db from '../database/db.js';
import { nanoid } from 'nanoid';

// Get all rides with optional filters
export function getAllRides(req, res) {
  try {
    const { source, destination, date, seats, maxPrice } = req.query;
    
    let query = `
      SELECT r.*, u.name as driver_name, u.photo as driver_photo, u.rating as driver_rating
      FROM rides r
      JOIN users u ON r.driver_id = u.id
      WHERE r.status = 'active' AND r.date_time >= datetime('now')
    `;
    
    const params = [];
    
    if (source) {
      query += ' AND LOWER(r.source) LIKE LOWER(?)';
      params.push(`%${source}%`);
    }
    
    if (destination) {
      query += ' AND LOWER(r.destination) LIKE LOWER(?)';
      params.push(`%${destination}%`);
    }
    
    if (date) {
      query += ' AND DATE(r.date_time) = DATE(?)';
      params.push(date);
    }
    
    if (seats) {
      query += ' AND r.available_seats >= ?';
      params.push(seats);
    }
    
    if (maxPrice) {
      query += ' AND r.price_per_seat <= ?';
      params.push(maxPrice);
    }
    
    query += ' ORDER BY r.date_time ASC';
    
    const stmt = db.prepare(query);
    const rides = stmt.all(...params);
    
    // Get waypoints and preferences for each ride
    const ridesWithDetails = rides.map(ride => {
      const waypoints = db.prepare('SELECT * FROM waypoints WHERE ride_id = ? ORDER BY order_index').all(ride.id);
      const preferences = db.prepare('SELECT * FROM ride_preferences WHERE ride_id = ?').get(ride.id);
      
      return {
        ...ride,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
        preferences: preferences || undefined,
      };
    });
    
    res.json({
      success: true,
      count: ridesWithDetails.length,
      data: ridesWithDetails,
    });
  } catch (error) {
    console.error('Get all rides error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get single ride by ID
export function getRideById(req, res) {
  try {
    const { id } = req.params;
    
    const ride = db.prepare(`
      SELECT r.*, u.name as driver_name, u.photo as driver_photo, u.rating as driver_rating, u.phone as driver_phone
      FROM rides r
      JOIN users u ON r.driver_id = u.id
      WHERE r.id = ?
    `).get(id);
    
    if (!ride) {
      return res.status(404).json({ success: false, error: 'Ride not found' });
    }
    
    // Get waypoints
    const waypoints = db.prepare('SELECT * FROM waypoints WHERE ride_id = ? ORDER BY order_index').all(id);
    
    // Get preferences
    const preferences = db.prepare('SELECT * FROM ride_preferences WHERE ride_id = ?').get(id);
    
    // Get bookings count
    const bookingsCount = db.prepare('SELECT SUM(seats_booked) as total FROM bookings WHERE ride_id = ? AND status != "cancelled"').get(id);
    
    res.json({
      success: true,
      data: {
        ...ride,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
        preferences: preferences || undefined,
        seatsBooked: bookingsCount?.total || 0,
      },
    });
  } catch (error) {
    console.error('Get ride by ID error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Create new ride
export function createRide(req, res) {
  try {
    const {
      source,
      destination,
      dateTime,
      availableSeats,
      pricePerSeat,
      vehicleModel,
      vehicleColor,
      vehicleNumber,
      distance,
      duration,
      co2Saved,
      waypoints,
      preferences,
      isLiveTrackingEnabled,
    } = req.body;
    
    const rideId = nanoid();
    const driverId = req.user.id;
    
    // Insert ride
    const insertRide = db.prepare(`
      INSERT INTO rides (
        id, driver_id, source, destination, date_time, available_seats,
        price_per_seat, vehicle_model, vehicle_color, vehicle_number,
        distance, duration, co2_saved, is_live_tracking_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertRide.run(
      rideId,
      driverId,
      source,
      destination,
      dateTime,
      availableSeats,
      pricePerSeat,
      vehicleModel,
      vehicleColor,
      vehicleNumber || null,
      distance,
      duration || null,
      co2Saved || 0,
      isLiveTrackingEnabled ? 1 : 0
    );
    
    // Insert waypoints if provided
    if (waypoints && waypoints.length > 0) {
      const insertWaypoint = db.prepare(`
        INSERT INTO waypoints (id, ride_id, location, order_index, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      waypoints.forEach((waypoint, index) => {
        insertWaypoint.run(
          waypoint.id || nanoid(),
          rideId,
          waypoint.location,
          index + 1,
          waypoint.coordinates?.lat || null,
          waypoint.coordinates?.lng || null
        );
      });
    }
    
    // Insert preferences if provided
    if (preferences) {
      const insertPreferences = db.prepare(`
        INSERT INTO ride_preferences (
          id, ride_id, has_ac, music_allowed, pets_allowed, luggage_space,
          smoking_allowed, women_only, instant_booking, extra_info
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertPreferences.run(
        nanoid(),
        rideId,
        preferences.hasAC ? 1 : 0,
        preferences.musicAllowed ? 1 : 0,
        preferences.petsAllowed ? 1 : 0,
        preferences.luggageSpace || 'medium',
        preferences.smokingAllowed ? 1 : 0,
        preferences.womenOnly ? 1 : 0,
        preferences.instantBooking ? 1 : 0,
        preferences.extraInfo || null
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Ride created successfully',
      data: { id: rideId },
    });
  } catch (error) {
    console.error('Create ride error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Update ride
export function updateRide(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;
    
    // Check if ride exists and belongs to user
    const ride = db.prepare('SELECT driver_id FROM rides WHERE id = ?').get(id);
    
    if (!ride) {
      return res.status(404).json({ success: false, error: 'Ride not found' });
    }
    
    if (ride.driver_id !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    
    // Build update query dynamically
    const allowedFields = ['availableSeats', 'pricePerSeat', 'status'];
    const updateFields = [];
    const values = [];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${dbField} = ?`);
        values.push(updates[field]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }
    
    values.push(new Date().toISOString());
    values.push(id);
    
    const updateStmt = db.prepare(`
      UPDATE rides
      SET ${updateFields.join(', ')}, updated_at = ?
      WHERE id = ?
    `);
    
    updateStmt.run(...values);
    
    res.json({
      success: true,
      message: 'Ride updated successfully',
    });
  } catch (error) {
    console.error('Update ride error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Delete ride
export function deleteRide(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if ride exists and belongs to user
    const ride = db.prepare('SELECT driver_id FROM rides WHERE id = ?').get(id);
    
    if (!ride) {
      return res.status(404).json({ success: false, error: 'Ride not found' });
    }
    
    if (ride.driver_id !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    
    // Check if there are any confirmed bookings
    const confirmedBookings = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE ride_id = ? AND status = "confirmed"').get(id);
    
    if (confirmedBookings.count > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete ride with confirmed bookings. Please cancel it instead.' 
      });
    }
    
    // Delete ride (cascades to waypoints, preferences, bookings)
    db.prepare('DELETE FROM rides WHERE id = ?').run(id);
    
    res.json({
      success: true,
      message: 'Ride deleted successfully',
    });
  } catch (error) {
    console.error('Delete ride error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get rides by driver
export function getRidesByDriver(req, res) {
  try {
    const { driverId } = req.params;
    
    const rides = db.prepare(`
      SELECT r.*, u.name as driver_name, u.photo as driver_photo, u.rating as driver_rating
      FROM rides r
      JOIN users u ON r.driver_id = u.id
      WHERE r.driver_id = ?
      ORDER BY r.date_time DESC
    `).all(driverId);
    
    // Get details for each ride
    const ridesWithDetails = rides.map(ride => {
      const waypoints = db.prepare('SELECT * FROM waypoints WHERE ride_id = ? ORDER BY order_index').all(ride.id);
      const preferences = db.prepare('SELECT * FROM ride_preferences WHERE ride_id = ?').get(ride.id);
      const bookingsCount = db.prepare('SELECT SUM(seats_booked) as total FROM bookings WHERE ride_id = ? AND status != "cancelled"').get(ride.id);
      
      return {
        ...ride,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
        preferences: preferences || undefined,
        seatsBooked: bookingsCount?.total || 0,
      };
    });
    
    res.json({
      success: true,
      count: ridesWithDetails.length,
      data: ridesWithDetails,
    });
  } catch (error) {
    console.error('Get rides by driver error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Search rides
export function searchRides(req, res) {
  try {
    const { source, destination, date, seats } = req.body;
    
    let query = `
      SELECT r.*, u.name as driver_name, u.photo as driver_photo, u.rating as driver_rating
      FROM rides r
      JOIN users u ON r.driver_id = u.id
      WHERE r.status = 'active' AND r.date_time >= datetime('now')
      AND LOWER(r.source) LIKE LOWER(?)
      AND LOWER(r.destination) LIKE LOWER(?)
    `;
    
    const params = [`%${source}%`, `%${destination}%`];
    
    if (date) {
      query += ' AND DATE(r.date_time) = DATE(?)';
      params.push(date);
    }
    
    if (seats) {
      query += ' AND r.available_seats >= ?';
      params.push(seats);
    }
    
    query += ' ORDER BY r.date_time ASC LIMIT 50';
    
    const rides = db.prepare(query).all(...params);
    
    // Get details for each ride
    const ridesWithDetails = rides.map(ride => {
      const waypoints = db.prepare('SELECT * FROM waypoints WHERE ride_id = ? ORDER BY order_index').all(ride.id);
      const preferences = db.prepare('SELECT * FROM ride_preferences WHERE ride_id = ?').get(ride.id);
      
      return {
        ...ride,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
        preferences: preferences || undefined,
      };
    });
    
    res.json({
      success: true,
      count: ridesWithDetails.length,
      data: ridesWithDetails,
    });
  } catch (error) {
    console.error('Search rides error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Update live location
export function updateLiveLocation(req, res) {
  try {
    const { id } = req.params;
    const { latitude, longitude, speed, heading } = req.body;
    const userId = req.user.id;
    
    // Check if ride exists and belongs to user
    const ride = db.prepare('SELECT driver_id, is_live_tracking_enabled FROM rides WHERE id = ?').get(id);
    
    if (!ride) {
      return res.status(404).json({ success: false, error: 'Ride not found' });
    }
    
    if (ride.driver_id !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    
    if (!ride.is_live_tracking_enabled) {
      return res.status(400).json({ success: false, error: 'Live tracking is not enabled for this ride' });
    }
    
    // Insert location update
    const insertLocation = db.prepare(`
      INSERT INTO live_locations (id, ride_id, latitude, longitude, speed, heading)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertLocation.run(nanoid(), id, latitude, longitude, speed || null, heading || null);
    
    res.json({
      success: true,
      message: 'Location updated successfully',
    });
  } catch (error) {
    console.error('Update live location error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get live location
export function getLiveLocation(req, res) {
  try {
    const { id } = req.params;
    
    const location = db.prepare(`
      SELECT * FROM live_locations
      WHERE ride_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `).get(id);
    
    if (!location) {
      return res.status(404).json({ success: false, error: 'No location data available' });
    }
    
    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error('Get live location error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
