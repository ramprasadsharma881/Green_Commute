import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  MapPin,
  Calendar,
  Users,
  Star,
  Leaf,
  IndianRupee,
  Navigation,
  Sparkles,
} from 'lucide-react';
import CarbonBadge from '@/components/CarbonBadge';
import { storage, Ride } from '@/lib/storage';
import { getActiveRides, listenToRides, AppRide } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

const FindRide = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: 'Sri Venkateswara College of Engineering, Bangalore (SVCE)',
    date: '',
    seats: '1',
  });
  const [rides, setRides] = useState<AppRide[]>([]);
  const [allRides, setAllRides] = useState<AppRide[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load rides from Firestore on component mount
  useEffect(() => {
    const loadRides = async () => {
      try {
        const firestoreRides = await getActiveRides();
        setAllRides(firestoreRides);
        console.log('✅ Loaded', firestoreRides.length, 'rides from Firestore');
      } catch (error) {
        console.error('❌ Error loading rides:', error);
        toast({
          title: 'Error',
          description: 'Failed to load rides. Please refresh.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRides();

    // Optional: Listen to real-time updates
    const unsubscribe = listenToRides((updatedRides) => {
      setAllRides(updatedRides);
      console.log('✅ Real-time update:', updatedRides.length, 'rides');
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = () => {
    // Extract keywords from search query
    const extractKeywords = (location: string) => {
      return location.toLowerCase()
        .split(',')
        .map(part => part.trim())
        .filter(part => part.length > 2);
    };

    const filtered = allRides.filter((ride) => {
      // If no search params, show all
      if (!searchParams.from && !searchParams.to) {
        return true;
      }

      // Check source match
      const matchFrom = !searchParams.from || (() => {
        const searchKeywords = extractKeywords(searchParams.from);
        const rideKeywords = extractKeywords(ride.source);
        return searchKeywords.some(keyword => 
          rideKeywords.some(rideKeyword => 
            rideKeyword.includes(keyword) || keyword.includes(rideKeyword)
          )
        );
      })();

      // Check destination match
      const matchTo = !searchParams.to || (() => {
        const searchKeywords = extractKeywords(searchParams.to);
        const rideKeywords = extractKeywords(ride.destination);
        return searchKeywords.some(keyword => 
          rideKeywords.some(rideKeyword => 
            rideKeyword.includes(keyword) || keyword.includes(rideKeyword)
          )
        );
      })();

      // BOTH must match if both are provided
      return matchFrom && matchTo;
    });
    
    setRides(filtered);
    setHasSearched(true);
    console.log('✅ Search results:', filtered.length, 'rides found');
  };

  const formatTime = (dateTime: any) => {
    // Handle both Firestore Timestamp and string
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateTime: any) => {
    // Handle both Firestore Timestamp and string
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading rides...</p>
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
          <h1 className="text-2xl font-bold">Find a Ride</h1>
          <p className="text-white/80 text-sm mt-1">Search for available carpools</p>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-6 py-6">
        {/* Search Form */}
        <Card className="p-6 mb-6 shadow-eco">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <LocationAutocomplete
                value={searchParams.from}
                onChange={(value) => setSearchParams({ ...searchParams, from: value })}
                placeholder="Enter pickup location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">To (Fixed Destination)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-primary" />
                <Input
                  id="to"
                  value="Sri Venkateswara College of Engineering, Bangalore (SVCE)"
                  disabled
                  className="pl-10 bg-primary/5 border-primary/20 text-foreground font-medium"
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                All rides go to Sri Venkateswara College of Engineering, Bangalore
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={searchParams.date}
                    onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seats">Seats</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="seats"
                    type="number"
                    min="1"
                    max="7"
                    value={searchParams.seats}
                    onChange={(e) => setSearchParams({ ...searchParams, seats: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSearch}
                className="flex-1 gradient-primary hover:opacity-90 transition-opacity"
              >
                <Search className="w-4 h-4 mr-2" />
                Search Rides
              </Button>
              <Button
                onClick={() => navigate('/smart-match')}
                variant="outline"
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Match
              </Button>
            </div>
          </div>
        </Card>

        {/* Results */}
        {hasSearched && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              {rides.length > 0 ? `${rides.length} rides found` : 'No rides found'}
            </h2>

            {rides.map((ride) => (
              <Card
                key={ride.id}
                className="p-5 hover-lift cursor-pointer"
                onClick={() => navigate(`/ride/${ride.id}`)}
              >
                {/* Driver Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {ride.driverName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">{ride.driverName}</h3>
                      <div className="flex items-center space-x-1 text-sm">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-muted-foreground">{ride.driverRating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <CarbonBadge co2Amount={ride.co2Saved} size="sm" variant="success" />
                      <div className="flex items-center space-x-1">
                        <IndianRupee className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">₹{ride.pricePerSeat}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route */}
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

                {/* Details */}
                <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border pt-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(ride.dateTime)}</span>
                    </span>
                    <span>{formatTime(ride.dateTime)}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{ride.availableSeats} seats</span>
                    </span>
                    <span className="flex items-center space-x-1 text-primary">
                      <Leaf className="w-3 h-3" />
                      <span>{ride.co2Saved} kg</span>
                    </span>
                  </div>
                </div>

                {/* Vehicle */}
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {ride.vehicleModel} • {ride.vehicleColor}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindRide;
