import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Sample ride data
const sampleRides = [
  {
    driverId: 'sample-driver-1',
    driverName: 'Rajesh Kumar',
    source: 'Rajanu, Karnataka, India',
    destination: 'Yelahanka, Bengaluru, Karnataka, India',
    dateTime: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 60 * 1000)), // 2 hours from now
    availableSeats: 3,
    pricePerSeat: 150,
    vehicleModel: 'Honda City',
    vehicleColor: 'Silver',
    vehicleNumber: 'KA-01-AB-1234',
    distance: 25,
    co2Saved: 3.6,
    status: 'active',
    driverRating: 4.8,
  },
  {
    driverId: 'sample-driver-2',
    driverName: 'Priya Sharma',
    source: 'Rajaji Nagar, Bengaluru, Karnataka, India',
    destination: 'Yelahanka New Town, Bengaluru, Karnataka, India',
    dateTime: Timestamp.fromDate(new Date(Date.now() + 4 * 60 * 60 * 1000)), // 4 hours from now
    availableSeats: 2,
    pricePerSeat: 120,
    vehicleModel: 'Maruti Swift',
    vehicleColor: 'Blue',
    vehicleNumber: 'KA-03-CD-5678',
    distance: 18,
    co2Saved: 2.5,
    status: 'active',
    driverRating: 4.9,
  },
  {
    driverId: 'sample-driver-3',
    driverName: 'Amit Patel',
    source: 'Rajaji Nagar, Bengaluru, Karnataka, India',
    destination: 'Yelahanka, Bengaluru, Karnataka, India',
    dateTime: Timestamp.fromDate(new Date(Date.now() + 6 * 60 * 60 * 1000)), // 6 hours from now
    availableSeats: 4,
    pricePerSeat: 100,
    vehicleModel: 'Toyota Innova',
    vehicleColor: 'White',
    vehicleNumber: 'KA-05-EF-9012',
    distance: 22,
    co2Saved: 4.2,
    status: 'active',
    driverRating: 4.7,
  },
  {
    driverId: 'sample-driver-4',
    driverName: 'Sneha Reddy',
    source: 'Koramangala, Bengaluru, Karnataka, India',
    destination: 'Yelahanka, Bengaluru, Karnataka, India',
    dateTime: Timestamp.fromDate(new Date(Date.now() + 3 * 60 * 60 * 1000)), // 3 hours from now
    availableSeats: 2,
    pricePerSeat: 180,
    vehicleModel: 'Hyundai i20',
    vehicleColor: 'Red',
    vehicleNumber: 'KA-02-GH-3456',
    distance: 28,
    co2Saved: 3.8,
    status: 'active',
    driverRating: 5.0,
  },
  {
    driverId: 'sample-driver-5',
    driverName: 'Vikram Singh',
    source: 'Rajanu, Karnataka, India',
    destination: 'Bangalore International Airport, Yelahanka, Karnataka, India',
    dateTime: Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 60 * 1000)), // 5 hours from now
    availableSeats: 3,
    pricePerSeat: 200,
    vehicleModel: 'Mahindra XUV500',
    vehicleColor: 'Black',
    vehicleNumber: 'KA-04-IJ-7890',
    distance: 30,
    co2Saved: 4.5,
    status: 'active',
    driverRating: 4.6,
  },
];

async function seedRides() {
  try {
    console.log('🌱 Starting to seed rides...');
    
    const ridesCollection = collection(db, 'rides');
    let successCount = 0;

    for (const ride of sampleRides) {
      try {
        const docRef = await addDoc(ridesCollection, {
          ...ride,
          createdAt: Timestamp.now(),
        });
        console.log(`✅ Created ride: ${ride.driverName} - ${ride.source} to ${ride.destination} (ID: ${docRef.id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to create ride for ${ride.driverName}:`, error);
      }
    }

    console.log(`\n🎉 Successfully seeded ${successCount} out of ${sampleRides.length} rides!`);
    console.log('You can now search and book rides in the app.');
  } catch (error) {
    console.error('❌ Error seeding rides:', error);
  }
}

// Run the seed function
seedRides();
