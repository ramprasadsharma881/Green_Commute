import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const dataDir = join(__dirname, '../../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'eco-commute.db');
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      photo TEXT,
      role TEXT DEFAULT 'both' CHECK(role IN ('driver', 'passenger', 'both')),
      green_score INTEGER DEFAULT 0,
      total_rides INTEGER DEFAULT 0,
      co2_saved REAL DEFAULT 0,
      rating REAL DEFAULT 5.0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Rides table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rides (
      id TEXT PRIMARY KEY,
      driver_id TEXT NOT NULL,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      date_time TEXT NOT NULL,
      available_seats INTEGER NOT NULL,
      price_per_seat REAL NOT NULL,
      vehicle_model TEXT NOT NULL,
      vehicle_color TEXT NOT NULL,
      vehicle_number TEXT,
      distance REAL NOT NULL,
      duration INTEGER,
      co2_saved REAL DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
      is_live_tracking_enabled BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Waypoints table
  db.exec(`
    CREATE TABLE IF NOT EXISTS waypoints (
      id TEXT PRIMARY KEY,
      ride_id TEXT NOT NULL,
      location TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      latitude REAL,
      longitude REAL,
      FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
    );
  `);

  // Ride preferences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ride_preferences (
      id TEXT PRIMARY KEY,
      ride_id TEXT UNIQUE NOT NULL,
      has_ac BOOLEAN DEFAULT 0,
      music_allowed BOOLEAN DEFAULT 1,
      pets_allowed BOOLEAN DEFAULT 0,
      luggage_space TEXT DEFAULT 'medium' CHECK(luggage_space IN ('small', 'medium', 'large')),
      smoking_allowed BOOLEAN DEFAULT 0,
      women_only BOOLEAN DEFAULT 0,
      instant_booking BOOLEAN DEFAULT 1,
      extra_info TEXT,
      FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
    );
  `);

  // Bookings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      ride_id TEXT NOT NULL,
      passenger_id TEXT NOT NULL,
      seats_booked INTEGER NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'refunded')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
      FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      booking_id TEXT UNIQUE NOT NULL,
      reviewer_id TEXT NOT NULL,
      reviewee_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Live locations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS live_locations (
      id TEXT PRIMARY KEY,
      ride_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL,
      heading REAL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
    CREATE INDEX IF NOT EXISTS idx_rides_datetime ON rides(date_time);
    CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_ride ON bookings(ride_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_passenger ON bookings(passenger_id);
    CREATE INDEX IF NOT EXISTS idx_waypoints_ride ON waypoints(ride_id);
  `);

  console.log('✅ Database initialized successfully');
}

// Add carbon credits to user balance
export function addCarbonCredits(userId, amount, type, source, description, rideId = null) {
  const { nanoid } = require('nanoid');
  const stmt = db.prepare(`
    INSERT INTO carbon_credits (id, user_id, ride_id, amount, type, source, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(nanoid(), userId, rideId, amount, type, source, description);
  
  // Update user's green_score
  db.prepare('UPDATE users SET green_score = green_score + ? WHERE id = ?').run(amount, userId);
}

// Get user's carbon credit balance
export function getUserCarbonBalance(userId) {
  const result = db.prepare(`
    SELECT 
      SUM(CASE WHEN type IN ('earned', 'purchased', 'bonus') THEN amount ELSE 0 END) -
      SUM(CASE WHEN type = 'redeemed' THEN amount ELSE 0 END) as balance
    FROM carbon_credits
    WHERE user_id = ?
  `).get(userId);
  
  return result?.balance || 0;
}

export default db;
