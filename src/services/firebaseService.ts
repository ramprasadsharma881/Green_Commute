import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Types
export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  role: 'driver' | 'passenger' | 'both';
  greenScore: number;
  totalRides: number;
  co2Saved: number;
  rating: number;
  createdAt: any;
}

export interface AppRide {
  id: string;
  driverId: string;
  driverName: string;
  driverRating?: number;
  source: string;
  destination: string;
  dateTime: Timestamp;
  availableSeats: number;
  pricePerSeat: number;
  vehicleModel: string;
  vehicleColor: string;
  vehicleNumber?: string;
  distance: number;
  co2Saved: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Timestamp;
}

// AUTH FUNCTIONS
export async function signUp(email: string, password: string, name: string, role: string = 'passenger') {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userData: AppUser = {
    id: user.uid,
    name,
    email: user.email!,
    role: role as any,
    greenScore: 0,
    totalRides: 0,
    co2Saved: 0,
    rating: 5.0,
    createdAt: serverTimestamp()
  };

  await setDoc(doc(db, 'users', user.uid), userData);

  // Give new user a welcome bonus
  await addDoc(collection(db, 'transactions'), {
    userId: user.uid,
    type: 'credit',
    amount: 250.0,
    description: 'Welcome bonus',
    createdAt: serverTimestamp()
  });

  console.log('✅ User created with welcome bonus:', user.uid);
  return userData;
}

export async function signIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

  if (!userDoc.exists()) {
    throw new Error('User data not found');
  }

  return { id: userCredential.user.uid, ...userDoc.data() } as AppUser;
}

export async function signOut() {
  await firebaseSignOut(auth);
  console.log('✅ Signed out');
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
  console.log('✅ Password reset email sent to:', email);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getUserData(uid: string): Promise<AppUser | null> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  return userDoc.exists() ? { id: uid, ...userDoc.data() } as AppUser : null;
}

// RIDE FUNCTIONS
export async function createRide(rideData: Omit<AppRide, 'id' | 'createdAt'>) {
  const docRef = await addDoc(collection(db, 'rides'), {
    ...rideData,
    createdAt: serverTimestamp()
  });
  console.log('✅ Ride created:', docRef.id);
  return docRef.id;
}

export async function getActiveRides(): Promise<AppRide[]> {
  const q = query(
    collection(db, 'rides'),
    where('status', '==', 'active'),
    where('dateTime', '>=', Timestamp.now()),
    orderBy('dateTime', 'asc'),
    limit(50)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppRide));
}

export async function getRidesByDriver(driverId: string): Promise<AppRide[]> {
  const q = query(
    collection(db, 'rides'),
    where('driverId', '==', driverId)
  );

  const snapshot = await getDocs(q);
  const rides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppRide));

  // Sort in memory to avoid composite index requirement
  return rides.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });
}

export async function updateRide(rideId: string, updates: Partial<AppRide>) {
  await updateDoc(doc(db, 'rides', rideId), updates as any);
  console.log('✅ Ride updated');
}

export async function deleteRide(rideId: string) {
  await deleteDoc(doc(db, 'rides', rideId));
  console.log('✅ Ride deleted');
}

export async function getRideById(rideId: string): Promise<AppRide | null> {
  const docSnap = await getDoc(doc(db, 'rides', rideId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as AppRide;
  }
  return null;
}

// REAL-TIME LISTENERS
export function listenToRides(callback: (rides: AppRide[]) => void) {
  const q = query(
    collection(db, 'rides'),
    where('status', '==', 'active'),
    where('dateTime', '>=', Timestamp.now()),
    orderBy('dateTime', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const rides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppRide));
    callback(rides);
  });
}

export function listenToRide(rideId: string, callback: (ride: AppRide | null) => void) {
  return onSnapshot(doc(db, 'rides', rideId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as AppRide);
    } else {
      callback(null);
    }
  });
}

// LOCATION TRACKING
export async function updateDriverLocation(rideId: string, driverId: string, lat: number, lng: number) {
  await setDoc(doc(db, 'liveLocations', rideId), {
    rideId,
    driverId,
    lat,
    lng,
    updatedAt: serverTimestamp()
  });
}

export function listenToDriverLocation(rideId: string, callback: (location: any) => void) {
  return onSnapshot(doc(db, 'liveLocations', rideId), (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  });
}

// BOOKING FUNCTIONS
export interface AppBooking {
  id: string;
  userId: string;
  rideId: string;
  userName: string;
  seatsBooked: number;
  totalAmount: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Timestamp;
}

export async function createBooking(bookingData: Omit<AppBooking, 'id' | 'createdAt'>) {
  const docRef = await addDoc(collection(db, 'bookings'), {
    ...bookingData,
    createdAt: serverTimestamp()
  });
  console.log('✅ Booking created:', docRef.id);
  return docRef.id;
}

export async function getBookingsByUser(userId: string): Promise<AppBooking[]> {
  const q = query(
    collection(db, 'bookings'),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppBooking));

  // Sort in memory instead of Firestore to avoid composite index requirement
  return bookings.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });
}

export async function getBookingsByRide(rideId: string): Promise<AppBooking[]> {
  const q = query(
    collection(db, 'bookings'),
    where('rideId', '==', rideId)
  );

  const snapshot = await getDocs(q);
  const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppBooking));

  // Sort in memory instead of Firestore to avoid composite index requirement
  return bookings.sort((a, b) => {
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });
}

export async function updateBooking(bookingId: string, updates: Partial<AppBooking>) {
  await updateDoc(doc(db, 'bookings', bookingId), updates as any);
  console.log('✅ Booking updated');
}

// WALLET FUNCTIONS
export interface AppTransaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  rideId?: string;
  bookingId?: string;
  createdAt: Timestamp;
}

export async function createTransaction(transactionData: Omit<AppTransaction, 'id' | 'createdAt'>) {
  const docRef = await addDoc(collection(db, 'transactions'), {
    ...transactionData,
    createdAt: serverTimestamp()
  });
  console.log('✅ Transaction created:', docRef.id);
  return docRef.id;
}

export async function getTransactionsByUser(userId: string): Promise<AppTransaction[]> {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppTransaction));
}

export async function getUserBalance(userId: string): Promise<number> {
  const transactions = await getTransactionsByUser(userId);
  const balance = transactions.reduce((sum, txn) => {
    return txn.type === 'credit' ? sum + txn.amount : sum - txn.amount;
  }, 0);
  return balance;
}

export async function updateUserBalance(userId: string, amount: number, type: 'credit' | 'debit', description: string, rideId?: string) {
  await createTransaction({
    userId,
    type,
    amount,
    description,
    rideId
  });
  console.log(`✅ ${type === 'credit' ? 'Added' : 'Deducted'} ₹${amount} ${type === 'credit' ? 'to' : 'from'} user wallet`);
}

// USER STATS FUNCTIONS
export async function updateUserStats(userId: string, updates: {
  co2Saved?: number;
  totalRides?: number;
  greenScore?: number;
}) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const currentData = userDoc.data();

    await updateDoc(userRef, {
      co2Saved: updates.co2Saved !== undefined
        ? (currentData.co2Saved || 0) + updates.co2Saved
        : currentData.co2Saved || 0,
      totalRides: updates.totalRides !== undefined
        ? (currentData.totalRides || 0) + updates.totalRides
        : currentData.totalRides || 0,
      greenScore: updates.greenScore !== undefined
        ? (currentData.greenScore || 0) + updates.greenScore
        : currentData.greenScore || 0,
    });

    console.log('✅ User stats updated');
  }
}

export async function calculateUserEcoStreak(userId: string): Promise<number> {
  // Get user's bookings
  const bookings = await getBookingsByUser(userId);

  // Get user's offered rides
  const offeredRides = await getRidesByDriver(userId);

  // Combine all ride dates
  const allDates: Date[] = [];

  bookings.forEach(booking => {
    if (booking.createdAt) {
      const date = booking.createdAt.toDate();
      allDates.push(date);
    }
  });

  offeredRides.forEach(ride => {
    if (ride.createdAt) {
      const date = ride.createdAt.toDate();
      allDates.push(date);
    }
  });

  if (allDates.length === 0) return 0;

  // Sort dates in descending order
  allDates.sort((a, b) => b.getTime() - a.getTime());

  // Calculate streak
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let checkDate = new Date(today);

  for (let i = 0; i < 365; i++) { // Check up to a year back
    const hasRideOnDate = allDates.some(date => {
      const rideDate = new Date(date);
      rideDate.setHours(0, 0, 0, 0);
      return rideDate.getTime() === checkDate.getTime();
    });

    if (hasRideOnDate) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      // If no ride today, check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Streak broken
      break;
    }
  }

  return streak;
}