import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Calendar,
  Clock,
  Users,
  IndianRupee,
  Car,
  Plus,
  ArrowRight,
  Check,
  Leaf,
  X,
  Radio,
  Music,
  Wind,
  Cigarette,
  PawPrint,
  Luggage,
  UserCheck,
  Zap,
  MapPinned,
  Info,
  Building,
} from 'lucide-react';
import { storage, Ride, Waypoint, RidePreferences } from '@/lib/storage';
import { createRide, updateUserStats } from '@/services/firebaseService';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { calculateRealDistance, calculateDynamicPrice, calculateCO2Savings as calculateCO2FromDistance } from '@/lib/googleMaps';

interface RideFormData {
  source: string;
  destination: string;
  date: string;
  time: string;
  availableSeats: string;
  pricePerSeat: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleNumber: string;
  description: string;
}

const OfferRide = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RideFormData>({
    source: '',
    destination: 'Sri Venkateswara College of Engineering, Bangalore (SVCE)',
    date: '',
    time: '',
    availableSeats: '3',
    pricePerSeat: '',
    vehicleModel: '',
    vehicleColor: '',
    vehicleNumber: '',
    description: '',
  });

  // Waypoints state
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [newWaypoint, setNewWaypoint] = useState('');

  // Live tracking state
  const [isLiveTrackingEnabled, setIsLiveTrackingEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Ride preferences state
  const [preferences, setPreferences] = useState<RidePreferences>({
    hasAC: false,
    musicAllowed: true,
    petsAllowed: false,
    luggageSpace: 'medium',
    smokingAllowed: false,
    womenOnly: false,
    instantBooking: true,
    extraInfo: '',
  });

  // Distance and pricing state
  const [realDistance, setRealDistance] = useState<number | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  const updateFormData = (field: keyof RideFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const updatePreferences = (field: keyof RidePreferences, value: any) => {
    setPreferences({ ...preferences, [field]: value });
  };

  // Get live location
  useEffect(() => {
    if (isLiveTrackingEnabled && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
          toast({
            title: 'Location access denied',
            description: 'Please enable location services to use live tracking',
            variant: 'destructive',
          });
          setIsLiveTrackingEnabled(false);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isLiveTrackingEnabled, toast]);

  // Waypoint management
  const addWaypoint = () => {
    if (!newWaypoint.trim()) return;
    const waypoint: Waypoint = {
      id: `waypoint-${Date.now()}`,
      location: newWaypoint,
      order: waypoints.length + 1,
    };
    setWaypoints([...waypoints, waypoint]);
    setNewWaypoint('');
    toast({
      title: 'Stop added! 📍',
      description: `Added: ${newWaypoint}`,
    });
  };

  const removeWaypoint = (id: string) => {
    setWaypoints(waypoints.filter((wp) => wp.id !== id));
  };

  // Calculate real distance when source, destination, or waypoints change
  useEffect(() => {
    const fetchDistance = async () => {
      if (!formData.source || !formData.destination) {
        setRealDistance(null);
        setEstimatedDuration(null);
        setSuggestedPrice(null);
        return;
      }

      setIsCalculatingDistance(true);
      
      try {
        const waypointLocations = waypoints.map(wp => wp.location);
        const result = await calculateRealDistance(
          formData.source,
          formData.destination,
          waypointLocations.length > 0 ? waypointLocations : undefined
        );

        if (result) {
          setRealDistance(result.distance);
          setEstimatedDuration(result.duration);
          
          // Calculate suggested price per seat
          const totalPrice = calculateDynamicPrice(result.distance);
          const pricePerSeat = Math.ceil(totalPrice / parseInt(formData.availableSeats || '1'));
          setSuggestedPrice(pricePerSeat);

          toast({
            title: 'Route calculated! 🗺️',
            description: `${result.distanceText} • ${result.durationText}`,
          });
        }
      } catch (error) {
        console.error('Distance calculation error:', error);
        toast({
          title: 'Could not calculate distance',
          description: 'Using estimated values instead',
          variant: 'destructive',
        });
      } finally {
        setIsCalculatingDistance(false);
      }
    };

    // Debounce the calculation
    const timer = setTimeout(() => {
      fetchDistance();
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.source, formData.destination, waypoints, formData.availableSeats, toast]);

  const calculateCO2Savings = (distance: number) => {
    // Average CO2 saved per passenger per km (carpooling vs solo driving)
    return (distance * 0.12 * parseInt(formData.availableSeats || '1')).toFixed(1);
  };

  const estimateDistance = () => {
    // Use real distance if available, otherwise fallback to estimation
    return realDistance || Math.floor(Math.random() * 30) + 10;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please login to offer a ride',
        variant: 'destructive',
      });
      return;
    }

    // Validate locations are complete addresses
    if (formData.source.length < 10 || formData.destination.length < 10) {
      toast({
        title: 'Invalid locations ⚠️',
        description: 'Please select complete addresses from the autocomplete dropdown for both pickup and destination.',
        variant: 'destructive',
      });
      return;
    }

    // Warn if no real distance was calculated (locations might be invalid)
    if (!realDistance) {
      toast({
        title: 'Location warning ⚠️',
        description: 'Could not calculate route. Ride will use estimated distance. Please verify your locations.',
        variant: 'destructive',
      });
    }

    try {
      const distance = estimateDistance();
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      // Calculate CO2 savings using the new function
      const co2Savings = realDistance 
        ? calculateCO2FromDistance(realDistance, parseInt(formData.availableSeats))
        : parseFloat(calculateCO2Savings(distance));

      // Create ride data for Firestore
      const rideData = {
        driverId: user.id,
        driverName: user.name,
        source: formData.source,
        destination: formData.destination,
        dateTime: Timestamp.fromDate(dateTime),
        availableSeats: parseInt(formData.availableSeats),
        pricePerSeat: parseInt(formData.pricePerSeat),
        vehicleModel: formData.vehicleModel,
        vehicleColor: formData.vehicleColor,
        vehicleNumber: formData.vehicleNumber || undefined,
        distance: distance,
        co2Saved: co2Savings,
        status: 'active' as const,
      };

      // Save to Firestore
      const rideId = await createRide(rideData);
      console.log('✅ Ride created in Firestore:', rideId);

      // Credit driver's Eco Impact and Green Score on publish
      try {
        const greenScoreDelta = Math.floor(co2Savings * 10);
        await updateUserStats(user.id, {
          co2Saved: co2Savings,
          greenScore: greenScoreDelta,
        });

        // Reflect immediately in local UI
        updateUser({
          co2Saved: (user.co2Saved || 0) + co2Savings,
          greenScore: (user.greenScore || 0) + greenScoreDelta,
        } as any);

        console.log('🌿 Driver credited on publish:', { co2Savings, greenScoreDelta });
      } catch (e) {
        console.warn('Could not credit driver stats on publish:', e);
      }

      toast({
        title: 'Ride published! 🚗',
        description: realDistance 
          ? `${realDistance.toFixed(1)} km • ${Math.round(estimatedDuration || 0)} min • ${co2Savings.toFixed(1)} kg CO₂ saved`
          : 'Your ride is now available for passengers to book',
      });

      setTimeout(() => navigate('/my-rides'), 1500);
    } catch (error: any) {
      console.error('❌ Error creating ride:', error);
      toast({
        title: 'Error',
        description: 'Failed to create ride. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const canProceedToStep2 = formData.source && formData.destination && formData.date && formData.time;
  const canProceedToStep3 = true; // Waypoints are optional
  const canProceedToStep4 = formData.availableSeats && formData.pricePerSeat;
  const canProceedToStep5 = true; // Preferences are optional
  const canSubmit = formData.vehicleModel && formData.vehicleColor;

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
          <h1 className="text-2xl font-bold">Offer a Ride</h1>
          <p className="text-white/80 text-sm mt-1">Share your journey, reduce emissions</p>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-6 py-6">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Step {step} of 5</span>
            <span className="text-sm text-muted-foreground">{Math.round((step / 5) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8 overflow-x-auto">
          {[
            { num: 1, label: 'Route', icon: MapPin },
            { num: 2, label: 'Stops', icon: MapPinned },
            { num: 3, label: 'Details', icon: Users },
            { num: 4, label: 'Preferences', icon: Zap },
            { num: 5, label: 'Vehicle', icon: Car },
          ].map(({ num, label, icon: Icon }) => (
            <div
              key={num}
              className={`flex flex-col items-center flex-shrink-0 ${
                step >= num ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all ${
                  step >= num
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > num ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className="text-xs font-medium text-center">{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Route & Time */}
        {step === 1 && (
          <Card className="p-6 shadow-eco animate-in fade-in-50 duration-300">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Route & Schedule</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="source">Pickup Location *</Label>
                <LocationAutocomplete
                  id="source"
                  value={formData.source}
                  onChange={(value) => updateFormData('source', value)}
                  placeholder="Search for pickup location..."
                  required={true}
                />
                <p className="text-xs text-muted-foreground">
                  🔍 Start typing and select from dropdown suggestions
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Drop-off Location (Fixed Destination) *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-primary z-10" />
                  <Input
                    id="destination"
                    value="Sri Venkateswara College of Engineering, Bangalore (SVCE)"
                    disabled
                    className="pl-10 bg-primary/5 border-primary/20 text-foreground font-medium"
                  />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  All rides go to Sri Venkateswara College of Engineering, Bangalore
                </p>
              </div>

              {/* Distance and Duration Display */}
              {(realDistance || isCalculatingDistance) && (
                <Card className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        {isCalculatingDistance ? 'Calculating route...' : 'Route Info'}
                      </span>
                    </div>
                    {realDistance && estimatedDuration && (
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-600">
                          {realDistance.toFixed(1)} km • {Math.round(estimatedDuration)} min
                        </div>
                        {suggestedPrice && (
                          <div className="text-xs text-muted-foreground">
                            Suggested: ₹{suggestedPrice}/seat
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => updateFormData('date', e.target.value)}
                      className="pl-10"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => updateFormData('time', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2}
              className="w-full mt-6 gradient-primary"
            >
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        )}

        {/* Step 2: Add Stops/Waypoints */}
        {step === 2 && (
          <Card className="p-6 shadow-eco animate-in fade-in-50 duration-300">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Add Stops (Optional)</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Add intermediate stops along your route to pick up more passengers
            </p>

            {/* Add waypoint input */}
            <div className="space-y-4 mb-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPinned className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter stop location (e.g., Main Street Corner)"
                    value={newWaypoint}
                    onChange={(e) => setNewWaypoint(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addWaypoint()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={addWaypoint} size="icon" className="gradient-primary">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Display waypoints */}
              {waypoints.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Your Stops ({waypoints.length})</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {waypoints.map((waypoint, index) => (
                      <div
                        key={waypoint.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium">{waypoint.location}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeWaypoint(waypoint.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {waypoints.length === 0 && (
                <Card className="p-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground text-center">
                    💡 No stops added yet. Add stops to maximize your ride efficiency!
                  </p>
                </Card>
              )}
            </div>

            {/* Route visualization */}
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">{formData.source}</span>
                </div>
                {waypoints.map((waypoint) => (
                  <div key={waypoint.id} className="flex items-center gap-2 ml-1.5">
                    <div className="w-2 h-8 border-l-2 border-dashed border-primary/40" />
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground">{waypoint.location}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 ml-1.5">
                  <div className="w-2 h-8 border-l-2 border-dashed border-primary/40" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm font-medium">{formData.destination}</span>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedToStep3}
                className="flex-1 gradient-primary"
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Ride Details */}
        {step === 3 && (
          <Card className="p-6 shadow-eco animate-in fade-in-50 duration-300">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Ride Details</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="seats">Available Seats</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="seats"
                    type="number"
                    min="1"
                    max="7"
                    value={formData.availableSeats}
                    onChange={(e) => updateFormData('availableSeats', e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  More seats = more impact! 🌱
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price per Seat (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder={suggestedPrice ? `Suggested: ₹${suggestedPrice}` : "e.g., 10"}
                    value={formData.pricePerSeat}
                    onChange={(e) => updateFormData('pricePerSeat', e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Keep it fair - cover fuel costs, not profit
                  </span>
                  {suggestedPrice && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary"
                      onClick={() => updateFormData('pricePerSeat', suggestedPrice.toString())}
                    >
                      Use suggested ₹{suggestedPrice}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Additional Notes (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., I can wait 5 minutes, No smoking please, etc."
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Live Tracking Toggle */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Radio className="w-5 h-5 text-blue-600" />
                      <Label htmlFor="live-tracking" className="text-base font-semibold cursor-pointer">
                        Enable Live Tracking
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Share your real-time location with passengers for better coordination
                      {currentLocation && (
                        <span className="block mt-1 text-xs text-green-600 dark:text-green-400">
                          📍 Location detected: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                        </span>
                      )}
                    </p>
                  </div>
                  <Switch
                    id="live-tracking"
                    checked={isLiveTrackingEnabled}
                    onCheckedChange={setIsLiveTrackingEnabled}
                  />
                </div>
              </Card>

              {/* Eco Impact Preview */}
              {formData.availableSeats && (
                <Card className="p-4 gradient-card">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Potential CO₂ Saved
                      </p>
                      <p className="text-lg font-bold text-primary">
                        ~{calculateCO2Savings(20)} kg
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!canProceedToStep4}
                className="flex-1 gradient-primary"
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Ride Preferences */}
        {step === 4 && (
          <Card className="p-6 shadow-eco animate-in fade-in-50 duration-300">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Ride Preferences</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Set your ride preferences to match with the right passengers
            </p>

            <div className="space-y-5">
              {/* AC Preference */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Wind className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <Label htmlFor="ac" className="font-medium cursor-pointer">Air Conditioning</Label>
                    <p className="text-xs text-muted-foreground">Your vehicle has AC</p>
                  </div>
                </div>
                <Switch
                  id="ac"
                  checked={preferences.hasAC}
                  onCheckedChange={(val) => updatePreferences('hasAC', val)}
                />
              </div>

              {/* Music Preference */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <Label htmlFor="music" className="font-medium cursor-pointer">Music Allowed</Label>
                    <p className="text-xs text-muted-foreground">Passengers can play music</p>
                  </div>
                </div>
                <Switch
                  id="music"
                  checked={preferences.musicAllowed}
                  onCheckedChange={(val) => updatePreferences('musicAllowed', val)}
                />
              </div>

              {/* Pets Preference */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <PawPrint className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <Label htmlFor="pets" className="font-medium cursor-pointer">Pets Allowed</Label>
                    <p className="text-xs text-muted-foreground">Small pets are welcome</p>
                  </div>
                </div>
                <Switch
                  id="pets"
                  checked={preferences.petsAllowed}
                  onCheckedChange={(val) => updatePreferences('petsAllowed', val)}
                />
              </div>

              {/* Smoking Preference */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Cigarette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <Label htmlFor="smoking" className="font-medium cursor-pointer">Smoking Allowed</Label>
                    <p className="text-xs text-muted-foreground">Smoking during the ride</p>
                  </div>
                </div>
                <Switch
                  id="smoking"
                  checked={preferences.smokingAllowed}
                  onCheckedChange={(val) => updatePreferences('smokingAllowed', val)}
                />
              </div>

              {/* Women Only Preference */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <Label htmlFor="women-only" className="font-medium cursor-pointer">Women Only</Label>
                    <p className="text-xs text-muted-foreground">Only women passengers</p>
                  </div>
                </div>
                <Switch
                  id="women-only"
                  checked={preferences.womenOnly}
                  onCheckedChange={(val) => updatePreferences('womenOnly', val)}
                />
              </div>

              {/* Instant Booking */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <Label htmlFor="instant" className="font-medium cursor-pointer">Instant Booking</Label>
                    <p className="text-xs text-muted-foreground">Auto-accept bookings</p>
                  </div>
                </div>
                <Switch
                  id="instant"
                  checked={preferences.instantBooking}
                  onCheckedChange={(val) => updatePreferences('instantBooking', val)}
                />
              </div>

              {/* Luggage Space */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Luggage className="w-4 h-4" />
                  Luggage Space
                </Label>
                <RadioGroup
                  value={preferences.luggageSpace}
                  onValueChange={(val) => updatePreferences('luggageSpace', val as 'small' | 'medium' | 'large')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="small" id="luggage-small" />
                    <Label htmlFor="luggage-small" className="cursor-pointer">Small</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="luggage-medium" />
                    <Label htmlFor="luggage-medium" className="cursor-pointer">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="large" id="luggage-large" />
                    <Label htmlFor="luggage-large" className="cursor-pointer">Large</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Extra Info */}
              <div className="space-y-2">
                <Label htmlFor="extra-info" className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Additional Information (Optional)
                </Label>
                <Textarea
                  id="extra-info"
                  placeholder="Any other preferences or rules..."
                  value={preferences.extraInfo}
                  onChange={(e) => updatePreferences('extraInfo', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setStep(3)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(5)}
                disabled={!canProceedToStep5}
                className="flex-1 gradient-primary"
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 5: Vehicle Info */}
        {step === 5 && (
          <Card className="p-6 shadow-eco animate-in fade-in-50 duration-300">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Vehicle Information</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle Model</Label>
                <div className="relative">
                  <Car className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="vehicle"
                    placeholder="e.g., Toyota Prius, Honda Civic"
                    value={formData.vehicleModel}
                    onChange={(e) => updateFormData('vehicleModel', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Vehicle Color</Label>
                <Input
                  id="color"
                  placeholder="e.g., Silver, Blue, Black"
                  value={formData.vehicleColor}
                  onChange={(e) => updateFormData('vehicleColor', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Helps passengers identify your vehicle
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle-number">Vehicle Number (Optional)</Label>
                <Input
                  id="vehicle-number"
                  placeholder="e.g., ABC-1234"
                  value={formData.vehicleNumber}
                  onChange={(e) => updateFormData('vehicleNumber', e.target.value)}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Registration number for passenger reference
                </p>
              </div>

              {/* Summary Card */}
              <Card className="p-4 bg-muted/50 border-2">
                <h3 className="font-semibold text-sm mb-3 text-foreground">🚗 Ride Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Route:</span>
                    <span className="font-medium text-foreground text-right max-w-[200px]">
                      {formData.source} → {formData.destination}
                    </span>
                  </div>
                  {waypoints.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stops:</span>
                      <span className="font-medium text-primary">{waypoints.length} stop(s)</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time:</span>
                    <span className="font-medium text-foreground">
                      {new Date(`${formData.date}T${formData.time}`).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(`${formData.date}T${formData.time}`).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Seats:</span>
                    <span className="font-medium text-foreground">{formData.availableSeats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price per Seat:</span>
                    <span className="font-medium text-primary">₹{formData.pricePerSeat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span className="font-medium text-foreground text-right">
                      {formData.vehicleModel} ({formData.vehicleColor})
                    </span>
                  </div>
                  {isLiveTrackingEnabled && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Live Tracking:</span>
                      <span className="font-medium text-green-600">✓ Enabled</span>
                    </div>
                  )}
                  {(preferences.hasAC || preferences.womenOnly || !preferences.smokingAllowed) && (
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Preferences:</span>
                      <div className="text-right text-xs space-y-1">
                        {preferences.hasAC && <div className="text-blue-600">❄️ AC</div>}
                        {preferences.womenOnly && <div className="text-pink-600">👥 Women Only</div>}
                        {!preferences.smokingAllowed && <div className="text-green-600">🚭 No Smoking</div>}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setStep(4)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 gradient-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Publish Ride
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OfferRide;
