import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MapPin,
  Navigation as NavigationIcon,
  Phone,
  MessageCircle,
  Share2,
  AlertCircle,
  Clock,
  User,
  Car,
} from 'lucide-react';
import { storage, Ride } from '@/lib/storage';
import { RatingModal } from '@/components/RatingModal';
import { loadGoogleMapsScript, getLocationCoordinates } from '@/lib/googleMaps';
import SOSButton from '@/components/SOSButton';
// Removed updateUserStats import - no longer needed for completion credits
import io from 'socket.io-client';
import { toast } from 'sonner';

const RideTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [ride, setRide] = useState<Ride | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState('15 min');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const socketRef = useRef<any>(null);
  const ratingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const allRides = storage.get<Ride[]>('rides:all') || [];
    const foundRide = allRides.find((r) => r.id === id);
    setRide(foundRide || null);

    // Simulate ETA updates
    const interval = setInterval(() => {
      setEstimatedArrival((prev) => {
        const current = parseInt(prev);
        if (current > 0) {
          return `${current - 1} min`;
        }
        return 'Arrived';
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [id, user, navigate]);

  // Real-time location tracking with Socket.IO
  useEffect(() => {
    if (!ride || !user) return;

    // Initialize Socket.IO connection
    const socket = io('http://localhost:3001', {
      auth: {
        token: storage.get('auth:token'),
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      toast.success('Connected to live tracking');
      
      // Join ride room for real-time updates
      socket.emit('join:ride', { rideId: ride.id });
    });

    // Listen for driver location updates
    socket.on('driver:location', (data: { lat: number; lng: number; driverId: string }) => {
      console.log('📍 Driver location updated:', data);
      setDriverLocation({ lat: data.lat, lng: data.lng });
      
      // Update driver marker on map
      if (driverMarkerRef.current && mapInstance.current) {
        driverMarkerRef.current.setPosition({ lat: data.lat, lng: data.lng });
      }
    });

    // If user is the driver, send location updates every 5 seconds
    if (user.id === ride.driverId) {
      const locationInterval = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const locationData = {
                rideId: ride.id,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              
              socket.emit('location:update', locationData);
              console.log('📤 Sent location update:', locationData);
            },
            (error) => {
              console.error('❌ Error getting location:', error);
              toast.error('Unable to get your location');
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            }
          );
        }
      }, 5000); // Update every 5 seconds

      return () => {
        clearInterval(locationInterval);
        socket.disconnect();
      };
    }

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.IO server');
    });

    socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      toast.error('Connection error. Retrying...');
    });

    return () => {
      socket.disconnect();
    };
  }, [ride, user]);

  // Mock payment handler
  const handleCompleteRide = async () => {
    // Mock payment - no gateway needed for prototype
    toast.success('Payment will be collected in cash', {
      description: `Total fare: ₹${ride?.pricePerSeat || 0}`,
    });
    
    // Update ride status to completed (in real app, this would be an API call)
    if (ride) {
      const allRides = storage.get<Ride[]>('rides:all') || [];
      const updatedRides = allRides.map((r) =>
        r.id === ride.id ? { ...r, status: 'completed' } : r
      );
      storage.set('rides:all', updatedRides);
    }
    
    // Note: Passenger already got credit when they booked the ride
    // No additional credits needed on completion to avoid double-counting

    // Queue rating modal after 5 seconds
    ratingTimerRef.current = setTimeout(() => {
      setShowRatingModal(true);
    }, 5000);

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  // Cleanup any pending timers on unmount
  useEffect(() => {
    return () => {
      if (ratingTimerRef.current) clearTimeout(ratingTimerRef.current);
    };
  }, []);

  const handleRatingSubmit = (payload: { rating: number; review: string; isAnonymous: boolean }) => {
    console.log('⭐ Rating submitted:', payload);
    toast.success('Thanks for your feedback!');
    setShowRatingModal(false);
    navigate('/my-rides');
  };

  const handleRatingOpenChange = (open: boolean) => {
    setShowRatingModal(open);
    if (!open) {
      navigate('/my-rides');
    }
  };

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      if (!ride || !mapRef.current) return;

      try {
        await loadGoogleMapsScript();
        
        const sourceCoords = await getLocationCoordinates(ride.source);
        const destCoords = await getLocationCoordinates(ride.destination);

        // Create map centered between source and destination
        const centerLat = (sourceCoords.lat + destCoords.lat) / 2;
        const centerLng = (sourceCoords.lng + destCoords.lng) / 2;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 12,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        mapInstance.current = map;

        // Add source marker (pickup)
        new google.maps.Marker({
          position: sourceCoords,
          map,
          title: ride.source,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        // Add destination marker
        new google.maps.Marker({
          position: destCoords,
          map,
          title: ride.destination,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        // Draw route
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#10b981',
            strokeWeight: 4,
          },
        });

        directionsService.route(
          {
            origin: sourceCoords,
            destination: destCoords,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === 'OK' && result) {
              directionsRenderer.setDirections(result);
            }
          }
        );

        // Add driver marker (car icon) - initially at source
        const driverMarker = new google.maps.Marker({
          position: driverLocation || sourceCoords,
          map,
          title: 'Driver Location',
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            rotation: 0,
          },
          zIndex: 1000,
        });

        driverMarkerRef.current = driverMarker;

        setMapLoaded(true);
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    initMap();
  }, [ride]);

  if (!ride) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Ride not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary text-white p-4">
        <div className="container max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/my-rides')}
            className="text-white hover:bg-white/10 mb-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Track Your Ride</h1>
            <Badge className="bg-white/20 text-white">In Progress</Badge>
          </div>
        </div>
      </header>

      {/* Google Maps */}
      <div className="relative h-[50vh]">
        <div ref={mapRef} className="w-full h-full" />
        
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center p-8">
              <MapPin className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-lg font-semibold text-foreground mb-2">
                Loading Map...
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{ride.source}</span>
                <NavigationIcon className="w-4 h-4" />
                <span>{ride.destination}</span>
              </div>
            </div>
          </div>
        )}

        {/* ETA Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <Card className="px-6 py-3 shadow-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">ETA</p>
                <p className="font-bold text-primary">{estimatedArrival}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-6 py-6 space-y-4">
        {/* Driver Info */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {ride.driverName.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">
                  {ride.driverName}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Car className="w-3 h-3" />
                  <span>{ride.vehicleModel} • {ride.vehicleColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex flex-col h-auto py-3"
              onClick={() => navigate(`/chat/${ride.driverId}`)}
            >
              <MessageCircle className="w-5 h-5 mb-1" />
              <span className="text-xs">Message</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-3">
              <Phone className="w-5 h-5 mb-1" />
              <span className="text-xs">Call</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-3">
              <Share2 className="w-5 h-5 mb-1" />
              <span className="text-xs">Share</span>
            </Button>
          </div>
        </Card>

        {/* Route Details */}
        <Card className="p-5">
          <h3 className="font-semibold text-card-foreground mb-4">Route Details</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pickup Point</p>
                <p className="font-medium text-card-foreground">{ride.source}</p>
              </div>
            </div>

            <div className="ml-4 h-8 border-l-2 border-dashed border-border"></div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                <NavigationIcon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Drop-off Point</p>
                <p className="font-medium text-card-foreground">{ride.destination}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Safety Features */}
        <Card className="p-5 border-2 border-primary/20">
          <div className="flex items-center space-x-3 mb-3">
            <AlertCircle className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-card-foreground">Safety First</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Your ride is being tracked. Share this trip with your emergency contacts.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share Trip
            </Button>
            <Button variant="destructive" size="sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              SOS
            </Button>
          </div>
        </Card>

        {/* Complete Ride Button with Mock Payment */}
        <Button
          className="w-full gradient-primary h-12"
          onClick={handleCompleteRide}
        >
          Complete Ride & Pay Cash
        </Button>
      </div>
      {/* Rating / Review Modal */}
      {ride && (
        <RatingModal
          open={showRatingModal}
          onOpenChange={handleRatingOpenChange}
          ride={{
            id: ride.id,
            driverName: ride.driverName,
            passengerName: user?.name,
            driverPhoto: (ride as any).driverPhoto,
            passengerPhoto: (user as any)?.photo,
            isDriver: user?.id === ride.driverId,
          }}
          onSubmit={handleRatingSubmit}
        />
      )}

      {/* SOS Button */}
      <SOSButton variant="floating" rideId={ride?.id} />
    </div>
  );
};

export default RideTracking;
