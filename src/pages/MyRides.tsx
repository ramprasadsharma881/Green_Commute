import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Calendar,
  Users,
  Car,
  Edit,
  Trash2,
  Clock,
  Plus,
  Leaf,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRidesByDriver, getBookingsByUser, getRideById, deleteRide, AppRide, AppBooking } from '@/services/firebaseService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const MyRides = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [myRides, setMyRides] = useState<AppRide[]>([]);
  const [bookedRides, setBookedRides] = useState<AppRide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadRides();
  }, [user]);

  const loadRides = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get rides offered by the user from Firebase
      const offeredRides = await getRidesByDriver(user.id);
      setMyRides(offeredRides);

      // Get bookings by the user from Firebase
      const userBookings = await getBookingsByUser(user.id);
      
      // Fetch ride details for each booking
      const bookedRidesPromises = userBookings.map(async (booking) => {
        const ride = await getRideById(booking.rideId);
        return ride;
      });
      
      const bookedRidesData = await Promise.all(bookedRidesPromises);
      setBookedRides(bookedRidesData.filter(ride => ride !== null) as AppRide[]);
      
      console.log('✅ Loaded rides from Firebase');
    } catch (error) {
      console.error('Error loading rides:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rides',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    try {
      await deleteRide(rideId);
      
      loadRides();
      
      toast({
        title: 'Ride deleted',
        description: 'Your ride has been removed successfully',
      });
    } catch (error) {
      console.error('Error deleting ride:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete ride',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (dateTime: any) => {
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateTime: any) => {
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isUpcoming = (dateTime: any) => {
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    return date > new Date();
  };

  const RideCard = ({ ride, isOffered }: { ride: AppRide; isOffered: boolean }) => (
    <Card className="p-5 hover-lift">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-3">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              isUpcoming(ride.dateTime) 
                ? 'bg-primary/10 text-primary' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {isUpcoming(ride.dateTime) ? 'Upcoming' : 'Completed'}
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-card-foreground">{ride.source}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-card-foreground">{ride.destination}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(ride.dateTime)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatTime(ride.dateTime)}</span>
            </span>
          </div>
        </div>

        <div className="text-right ml-4">
          <p className="text-xl font-bold text-primary">₹{ride.pricePerSeat}</p>
          <p className="text-xs text-muted-foreground">per seat</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center space-x-4 text-sm">
          <span className="flex items-center space-x-1 text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{ride.availableSeats} seats</span>
          </span>
          <span className="flex items-center space-x-1 text-primary">
            <Leaf className="w-3 h-3" />
            <span>{ride.co2Saved} kg</span>
          </span>
          <span className="flex items-center space-x-1 text-muted-foreground">
            <Car className="w-3 h-3" />
            <span>{ride.vehicleModel}</span>
          </span>
        </div>

        {isOffered && isUpcoming(ride.dateTime) && (
          <div className="flex items-center space-x-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this ride?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your ride offer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteRide(ride.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </Card>
  );

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your rides...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary text-white p-6">
        <div className="container max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/10 mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">My Rides</h1>
          <p className="text-white/80 text-sm mt-1">Manage your rides and bookings</p>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-6 py-6">
        {/* Quick Action */}
        <Button
          onClick={() => navigate('/offer-ride')}
          className="w-full mb-6 gradient-primary h-12"
        >
          <Plus className="w-4 h-4 mr-2" />
          Offer a New Ride
        </Button>

        {/* Tabs */}
        <Tabs defaultValue="offered" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="offered">
              Offered Rides ({myRides.length})
            </TabsTrigger>
            <TabsTrigger value="booked">
              Booked Rides ({bookedRides.length})
            </TabsTrigger>
          </TabsList>

          {/* Offered Rides */}
          <TabsContent value="offered" className="space-y-4">
            {myRides.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">
                  No rides offered yet
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Start sharing your commute and help reduce emissions!
                </p>
                <Button
                  onClick={() => navigate('/offer-ride')}
                  className="gradient-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Offer Your First Ride
                </Button>
              </Card>
            ) : (
              <>
                {myRides.filter(ride => isUpcoming(ride.dateTime)).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Upcoming
                    </h3>
                    <div className="space-y-3">
                      {myRides
                        .filter(ride => isUpcoming(ride.dateTime))
                        .map(ride => (
                          <RideCard key={ride.id} ride={ride} isOffered={true} />
                        ))}
                    </div>
                  </div>
                )}

                {myRides.filter(ride => !isUpcoming(ride.dateTime)).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Past Rides
                    </h3>
                    <div className="space-y-3">
                      {myRides
                        .filter(ride => !isUpcoming(ride.dateTime))
                        .map(ride => (
                          <RideCard key={ride.id} ride={ride} isOffered={true} />
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Booked Rides */}
          <TabsContent value="booked" className="space-y-4">
            {bookedRides.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">
                  No bookings yet
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Find a ride and start your eco-friendly journey!
                </p>
                <Button
                  onClick={() => navigate('/find-ride')}
                  className="gradient-primary"
                >
                  Find a Ride
                </Button>
              </Card>
            ) : (
              <>
                {bookedRides.filter(ride => isUpcoming(ride.dateTime)).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Upcoming
                    </h3>
                    <div className="space-y-3">
                      {bookedRides
                        .filter(ride => isUpcoming(ride.dateTime))
                        .map(ride => (
                          <RideCard key={ride.id} ride={ride} isOffered={false} />
                        ))}
                    </div>
                  </div>
                )}

                {bookedRides.filter(ride => !isUpcoming(ride.dateTime)).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Past Rides
                    </h3>
                    <div className="space-y-3">
                      {bookedRides
                        .filter(ride => !isUpcoming(ride.dateTime))
                        .map(ride => (
                          <RideCard key={ride.id} ride={ride} isOffered={false} />
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyRides;
