import db from './db.js';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

/**
 * Seed database with test drivers for prototype testing
 * Run this after initializing the database
 */

export async function seedTestDrivers() {
  console.log('👥 Seeding test drivers...');

  const testDrivers = [
    {
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@test.com',
      phone: '9876543210',
      rating: 4.8,
      vehicleModel: 'Honda City',
      vehicleColor: 'Silver',
      vehicleNumber: 'DL 01 AB 1234',
    },
    {
      name: 'Amit Sharma',
      email: 'amit.sharma@test.com',
      phone: '9876543211',
      rating: 4.6,
      vehicleModel: 'Maruti Swift',
      vehicleColor: 'White',
      vehicleNumber: 'DL 02 CD 5678',
    },
    {
      name: 'Vikram Singh',
      email: 'vikram.singh@test.com',
      phone: '9876543212',
      rating: 4.9,
      vehicleModel: 'Hyundai Creta',
      vehicleColor: 'Black',
      vehicleNumber: 'DL 03 EF 9012',
    },
    {
      name: 'Suresh Patel',
      email: 'suresh.patel@test.com',
      phone: '9876543213',
      rating: 4.7,
      vehicleModel: 'Toyota Innova',
      vehicleColor: 'Grey',
      vehicleNumber: 'DL 04 GH 3456',
    },
    {
      name: 'Rohit Verma',
      email: 'rohit.verma@test.com',
      phone: '9876543214',
      rating: 4.5,
      vehicleModel: 'Tata Nexon',
      vehicleColor: 'Blue',
      vehicleNumber: 'DL 05 IJ 7890',
    },
  ];

  try {
    // Default password for all test drivers: "driver123"
    const passwordHash = await bcrypt.hash('driver123', 10);

    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (
        id, name, email, password_hash, phone, role, rating,
        green_score, total_rides, co2_saved, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    let insertedCount = 0;

    for (const driver of testDrivers) {
      const driverId = nanoid();
      
      try {
        const result = insertUser.run(
          driverId,
          driver.name,
          driver.email,
          passwordHash,
          driver.phone,
          'driver', // Role
          driver.rating,
          Math.floor(driver.rating * 200), // Green score based on rating
          Math.floor(Math.random() * 50) + 20, // Random rides between 20-70
          Math.random() * 500 + 100 // Random CO2 saved
        );

        if (result.changes > 0) {
          insertedCount++;
          console.log(`  ✅ Added driver: ${driver.name} (${driver.email})`);
          
          // Store driver info for creating sample rides
          driver.id = driverId;
        }
      } catch (error) {
        if (error.message.includes('UNIQUE')) {
          console.log(`  ⚠️  Driver already exists: ${driver.name}`);
        } else {
          throw error;
        }
      }
    }

    console.log(`\n✅ Seeded ${insertedCount} test drivers`);
    console.log('\n📋 Test Driver Login Credentials:');
    console.log('Email: rajesh.kumar@test.com');
    console.log('Email: amit.sharma@test.com');
    console.log('Email: vikram.singh@test.com');
    console.log('Email: suresh.patel@test.com');
    console.log('Email: rohit.verma@test.com');
    console.log('Password (all): driver123\n');

    return testDrivers;
  } catch (error) {
    console.error('❌ Error seeding test drivers:', error);
    throw error;
  }
}

/**
 * Create sample rides from test drivers
 */
export async function seedSampleRides() {
  console.log('🚗 Creating sample rides from test drivers...');

  const drivers = db.prepare('SELECT * FROM users WHERE role = ?').all('driver');

  if (drivers.length === 0) {
    console.log('⚠️  No drivers found. Seed drivers first.');
    return;
  }

  const sampleRoutes = [
    {
      source: 'Connaught Place, New Delhi',
      destination: 'Noida Sector 62',
      distance: 25.5,
      pricePerSeat: 150,
    },
    {
      source: 'Gurgaon Cyber City',
      destination: 'Delhi Airport',
      distance: 15.2,
      pricePerSeat: 200,
    },
    {
      source: 'Dwarka, Delhi',
      destination: 'Connaught Place, New Delhi',
      distance: 18.3,
      pricePerSeat: 120,
    },
    {
      source: 'Noida City Center',
      destination: 'Saket, Delhi',
      distance: 22.8,
      pricePerSeat: 140,
    },
  ];

  const vehicleDetails = [
    { model: 'Honda City', color: 'Silver', number: 'DL 01 AB 1234' },
    { model: 'Maruti Swift', color: 'White', number: 'DL 02 CD 5678' },
    { model: 'Hyundai Creta', color: 'Black', number: 'DL 03 EF 9012' },
    { model: 'Toyota Innova', color: 'Grey', number: 'DL 04 GH 3456' },
    { model: 'Tata Nexon', color: 'Blue', number: 'DL 05 IJ 7890' },
  ];

  const insertRide = db.prepare(`
    INSERT INTO rides (
      id, driver_id, source, destination, date_time,
      available_seats, price_per_seat, vehicle_model, vehicle_color,
      vehicle_number, distance, duration, co2_saved, status,
      is_live_tracking_enabled, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  let createdRides = 0;

  try {
    for (let i = 0; i < Math.min(drivers.length, sampleRoutes.length); i++) {
      const driver = drivers[i];
      const route = sampleRoutes[i];
      const vehicle = vehicleDetails[i % vehicleDetails.length];
      
      // Create ride for today + random hours
      const today = new Date();
      today.setHours(today.getHours() + Math.floor(Math.random() * 5) + 1);
      
      const rideId = nanoid();
      const duration = Math.floor(route.distance * 2.5); // Approximate minutes
      const co2Saved = route.distance * 0.12; // kg CO2 per km

      insertRide.run(
        rideId,
        driver.id,
        route.source,
        route.destination,
        today.toISOString(),
        4, // Available seats
        route.pricePerSeat,
        vehicle.model,
        vehicle.color,
        vehicle.number,
        route.distance,
        duration,
        co2Saved,
        'active',
        1, // Live tracking enabled
      );

      createdRides++;
      console.log(`  ✅ Created ride: ${route.source} → ${route.destination}`);
    }

    console.log(`\n✅ Created ${createdRides} sample rides`);
  } catch (error) {
    console.error('❌ Error creating sample rides:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await seedTestDrivers();
    await seedSampleRides();
    console.log('\n🎉 All test data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}
