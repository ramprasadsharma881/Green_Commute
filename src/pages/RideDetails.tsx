import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Calendar,
  Users,
  Star,
  Leaf,
  Car,
  Shield,
} from 'lucide-react';
import { storage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import PaymentModal from '@/components/PaymentModal';
import { RatingModal } from '@/components/RatingModal';
import { getRideById, updateRide, AppRide, createBooking, updateUserBalance, updateUserStats, getUserBalance } from '@/services/firebaseService';
import { useAuth } from '@/contexts/AuthContext';
import RouteMap from '@/components/RouteMap';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { calculateRealDistance, calculateDynamicPrice, calculateSegmentPrice } from '@/lib/googleMaps';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const RideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ride, setRide] = useState<AppRide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const ratingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dynamic Pricing State
  const [isCustomRoute, setIsCustomRoute] = useState(false);
  const [customPickup, setCustomPickup] = useState('');
  const [customDropoff, setCustomDropoff] = useState('');
  const [customDistance, setCustomDistance] = useState<number | null>(null);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch ride from Firebase
  useEffect(() => {
    const fetchRide = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const rideData = await getRideById(id);
        setRide(rideData);
      } catch (error) {
        console.error('Error fetching ride:', error);
        toast({
          title: 'Error',
          description: 'Failed to load ride details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRide();
  }, [id, toast]);

  // Calculate dynamic price when custom route changes
  useEffect(() => {
    const calculateCustomRoute = async () => {
      if (!isCustomRoute || !customPickup || !customDropoff || !ride) {
        setCustomDistance(null);
        setCustomPrice(null);
        return;
      }

      setIsCalculating(true);
      try {
        const result = await calculateRealDistance(customPickup, customDropoff);
        if (result) {
          setCustomDistance(result.distance);
          
          // Calculate segment-based pricing
          // If the passenger is taking only part of the route, they should pay proportionally less
          const totalRideDistance = ride.distance;
          const segmentDistance = result.distance;
          
          // Calculate the full ride price based on total distance
          const totalRidePrice = ride.pricePerSeat;
          
          // Use segment-based pricing if passenger distance is less than total distance
          let newPrice: number;
          if (segmentDistance < totalRideDistance) {
            // Passenger is joining midway or getting off early - calculate reduced fare
            newPrice = calculateSegmentPrice(totalRideDistance, segmentDistance, totalRidePrice);
            
            toast({
              title: 'Reduced fare applied! 💰',
              description: `You're traveling ${segmentDistance.toFixed(1)}km of ${totalRideDistance}km total route`,
            });
          } else {
            // Passenger is traveling the full route or more - use standard pricing
            newPrice = Math.ceil(calculateDynamicPrice(segmentDistance));
          }

          setCustomPrice(newPrice);
        }
      } catch (error) {
        console.error('Error calculating custom route:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    const timer = setTimeout(calculateCustomRoute, 1000);
    return () => clearTimeout(timer);
  }, [isCustomRoute, customPickup, customDropoff, ride, toast]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (ratingTimerRef.current) {
        clearTimeout(ratingTimerRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Ride not found</p>
          <Button onClick={() => navigate('/find-ride')} className="mt-4">
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  const formatTime = (dateTime: any) => {
    // Handle both Firestore Timestamp and string
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateTime: any) => {
    // Handle both Firestore Timestamp and string
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleBookRide = async () => {
    if (!user) {
      toast({
        title: 'Please login',
        description: 'You need to be logged in to book a ride',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    // Check if user has sufficient balance
    const rideAmount = (isCustomRoute && customPrice) ? customPrice : ride?.pricePerSeat || 0;
    const userBalance = await getUserBalance(user.id);
    
    if (userBalance < rideAmount) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ₹${rideAmount.toFixed(2)} but only have ₹${userBalance.toFixed(2)}. Please add money to your wallet.`,
        variant: 'destructive',
      });
      navigate('/wallet');
      return;
    }
    
    // Open payment modal
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    if (!user || !ride) return;

    try {
      // Create booking in Firebase
      await createBooking({
        userId: user.id,
        rideId: ride.id,
        userName: user.name,
        seatsBooked: 1,
        totalAmount: (isCustomRoute && customPrice) ? customPrice : ride.pricePerSeat,
        pickupLocation: (isCustomRoute && customPickup) ? customPickup : ride.source,
        dropoffLocation: (isCustomRoute && customDropoff) ? customDropoff : ride.destination,
        status: 'confirmed'
      });

      // Update ride available seats in Firebase
      await updateRide(ride.id, {
        availableSeats: ride.availableSeats - 1
      });

      // Deduct amount from user wallet
      await updateUserBalance(
        user.id,
        (isCustomRoute && customPrice) ? customPrice : ride.pricePerSeat,
        'debit',
        `Ride booking: ${(isCustomRoute && customPickup) ? customPickup : ride.source} to ${(isCustomRoute && customDropoff) ? customDropoff : ride.destination}`,
        ride.id
      );

      // Credit amount to driver wallet
      await updateUserBalance(
        ride.driverId,
        (isCustomRoute && customPrice) ? customPrice : ride.pricePerSeat,
        'credit',
        `Ride earnings: ${(isCustomRoute && customPickup) ? customPickup : ride.source} to ${(isCustomRoute && customDropoff) ? customDropoff : ride.destination}`,
        ride.id
      );

      // Calculate CO2 saved per passenger (divide total ride CO2 by number of passengers)
      const co2PerPassenger = ride.co2Saved / (ride.availableSeats + 1); // +1 for driver
      const greenScoreDelta = Math.floor(co2PerPassenger * 10); // 10 points per kg CO2

      // Update passenger's stats only (driver already got credit on publish)
      await updateUserStats(user.id, {
        co2Saved: co2PerPassenger,
        totalRides: 1,
        greenScore: greenScoreDelta
      });

      // Update local user state for immediate UI reflection
      updateUser({
        co2Saved: (user.co2Saved || 0) + co2PerPassenger,
        totalRides: (user.totalRides || 0) + 1,
        greenScore: (user.greenScore || 0) + greenScoreDelta,
      } as any);

      // Close modal
      setShowPaymentModal(false);

      toast({
        title: 'Booking confirmed! 🎉',
        description: `You saved ${co2PerPassenger.toFixed(2)} kg of CO₂!`,
      });

      // Queue rating modal after 5 seconds
      ratingTimerRef.current = setTimeout(() => {
        setShowRatingModal(true);
      }, 5000);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm booking. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary text-white p-6">
        <div className="container max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/find-ride')}
            className="text-white hover:bg-white/10 mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Ride Details</h1>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-6 py-6 space-y-4">
        {/* Driver Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {ride.driverName.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-card-foreground">{ride.driverName}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{ride.driverRating || 5.0}</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Route Map */}
          <RouteMap
            origin={ride.source}
            destination={ride.destination}
            className="h-64 mb-6"
          />

          {/* Route Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Pickup</p>
                <p className="font-semibold text-card-foreground">{ride.source}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                <Navigation className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Destination</p>
                <p className="font-semibold text-card-foreground">{ride.destination}</p>
              </div>
            </div>
          </div>

          {/* Customize Route Section */}
          <Card className="p-4 mb-6 bg-muted/30 border-dashed">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <Label htmlFor="custom-route" className="font-semibold cursor-pointer">
                  Customize My Route
                </Label>
              </div>
              <Switch
                id="custom-route"
                checked={isCustomRoute}
                onCheckedChange={(checked) => {
                  setIsCustomRoute(checked);
                  if (checked && ride) {
                    setCustomPickup(ride.source);
                    setCustomDropoff(ride.destination);
                  }
                }}
              />
            </div>

            {!isCustomRoute && (
              <p className="text-xs text-muted-foreground">
                💡 Joining midway or getting off early? Enable custom route to pay only for your segment!
              </p>
            )}

            {isCustomRoute && (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">My Pickup Location</Label>
                  <LocationAutocomplete
                    value={customPickup}
                    onChange={setCustomPickup}
                    placeholder="Enter your pickup point"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">My Drop-off Location</Label>
                  <LocationAutocomplete
                    value={customDropoff}
                    onChange={setCustomDropoff}
                    placeholder="Enter your drop-off point"
                  />
                </div>

                {isCalculating && (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    Calculating new fare...
                  </p>
                )}

                {customDistance && !isCalculating && (
                  <div className="flex items-center justify-between text-sm bg-primary/5 p-2 rounded">
                    <span>New Distance: <strong>{customDistance.toFixed(1)} km</strong></span>
                    {customPrice && (
                      <span className="text-green-600 font-bold">
                        New Fare: ₹{customPrice}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Trip Info Grid */}
          <div className="grid grid-cols-2 gap-4 pb-6 border-b border-border">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-medium text-card-foreground">{formatDate(ride.dateTime)}</p>
                  <p className="text-sm text-muted-foreground">{formatTime(ride.dateTime)}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Available Seats</p>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-primary" />
                <p className="font-medium text-card-foreground">{ride.availableSeats} seats</p>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="pt-6">
            <p className="text-sm text-muted-foreground mb-3">Vehicle</p>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-card-foreground">{ride.vehicleModel}</p>
                <p className="text-sm text-muted-foreground">{ride.vehicleColor}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Eco Impact */}
        <Card className="p-6 gradient-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Environmental Impact</p>
                <p className="text-2xl font-bold text-primary">{ride.co2Saved} kg CO₂</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Distance</p>
              <p className="font-semibold text-card-foreground">{ride.distance} km</p>
            </div>
          </div>
        </Card>

        {/* Price and Book */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Price per seat</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-primary">
                  ₹{(isCustomRoute && customPrice) ? customPrice : ride.pricePerSeat}
                </p>
                {isCustomRoute && customPrice && customPrice < ride.pricePerSeat && (
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{ride.pricePerSeat}
                  </span>
                )}
              </div>
              {isCustomRoute && customPrice && customPrice < ride.pricePerSeat && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    💰 Save ₹{ride.pricePerSeat - customPrice} with partial route
                  </span>
                </div>
              )}
              {isCustomRoute && customDistance && (
                <p className="text-xs text-muted-foreground mt-2">
                  *Traveling {customDistance.toFixed(1)}km of {ride.distance}km total
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total (1 seat)</p>
              <p className="text-2xl font-bold text-card-foreground">
                ₹{(isCustomRoute && customPrice) ? customPrice : ride.pricePerSeat}
              </p>
            </div>
          </div>

          <Button
            onClick={handleBookRide}
            className="w-full h-12 gradient-primary hover:opacity-90 transition-opacity"
          >
            Book This Ride
          </Button>
        </Card>
      </div>

      {/* Payment Modal */}
      {ride && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={(isCustomRoute && customPrice) ? customPrice : ride.pricePerSeat}
          rideDetails={{
            from: (isCustomRoute && customPickup) ? customPickup : ride.source,
            to: (isCustomRoute && customDropoff) ? customDropoff : ride.destination,
            date: formatDate(ride.dateTime),
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Rating Modal */}
      {ride && (
        <RatingModal
          open={showRatingModal}
          onOpenChange={(open) => {
            setShowRatingModal(open);
            if (!open) navigate('/my-rides');
          }}
          ride={{
            id: ride.id,
            driverName: ride.driverName,
            passengerName: user?.name
          }}
          onSubmit={(ratingData) => {
            console.log('📝 Booking feedback submitted:', ratingData);
            setShowRatingModal(false);
            navigate('/my-rides');
          }}
        />
      )}
    </div>
  );
};

export default RideDetails;
