// Storage utility for persistent data
export const storage = {
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },

  get: <T = any>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  },
};

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  role: 'driver' | 'passenger' | 'both';
  greenScore: number;
  totalRides: number;
  co2Saved: number;
  rating: number;
  createdAt: string;
}

export interface Waypoint {
  id: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  order: number;
}

export interface RidePreferences {
  hasAC: boolean;
  musicAllowed: boolean;
  petsAllowed: boolean;
  luggageSpace: 'small' | 'medium' | 'large';
  smokingAllowed: boolean;
  womenOnly: boolean;
  instantBooking: boolean;
  extraInfo?: string;
}

export interface LiveLocation {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

export interface Ride {
  id: string;
  driverId: string;
  driverName: string;
  driverPhoto?: string;
  driverRating: number;
  source: string;
  destination: string;
  waypoints?: Waypoint[];
  dateTime: string;
  availableSeats: number;
  pricePerSeat: number;
  vehicleModel: string;
  vehicleColor: string;
  vehicleNumber?: string;
  co2Saved: number;
  distance: number;
  duration?: number; // in minutes
  preferences?: RidePreferences;
  liveLocation?: LiveLocation;
  isLiveTrackingEnabled?: boolean;
}

// Initialize demo data
export const initializeDemoData = () => {
  const demoRides: Ride[] = [
    {
      id: 'ride-1',
      driverId: 'user-demo-1',
      driverName: 'Sarah Miller',
      driverRating: 4.8,
      source: 'Downtown Station',
      destination: 'Tech Park Area',
      dateTime: new Date(Date.now() + 3600000).toISOString(),
      availableSeats: 2,
      pricePerSeat: 12,
      vehicleModel: 'Toyota Prius',
      vehicleColor: 'Silver',
      co2Saved: 2.5,
      distance: 15,
    },
    {
      id: 'ride-2',
      driverId: 'user-demo-2',
      driverName: 'Mike Chen',
      driverRating: 4.9,
      source: 'Airport Terminal',
      destination: 'City Center',
      dateTime: new Date(Date.now() + 7200000).toISOString(),
      availableSeats: 3,
      pricePerSeat: 18,
      vehicleModel: 'Honda Civic Hybrid',
      vehicleColor: 'Blue',
      co2Saved: 3.2,
      distance: 22,
    },
    {
      id: 'ride-3',
      driverId: 'user-demo-3',
      driverName: 'Emma Wilson',
      driverRating: 5.0,
      source: 'University Campus',
      destination: 'Shopping District',
      dateTime: new Date(Date.now() + 5400000).toISOString(),
      availableSeats: 1,
      pricePerSeat: 8,
      vehicleModel: 'Nissan Leaf',
      vehicleColor: 'White',
      co2Saved: 1.8,
      distance: 10,
    },
    {
      id: 'ride-4',
      driverId: 'user-demo-4',
      driverName: 'James Rodriguez',
      driverRating: 4.7,
      source: 'Business District',
      destination: 'Residential Area',
      dateTime: new Date(Date.now() + 10800000).toISOString(),
      availableSeats: 2,
      pricePerSeat: 15,
      vehicleModel: 'Tesla Model 3',
      vehicleColor: 'Black',
      co2Saved: 2.8,
      distance: 18,
    },
  ];

  if (!storage.get('rides:all')) {
    storage.set('rides:all', demoRides);
  }
};
