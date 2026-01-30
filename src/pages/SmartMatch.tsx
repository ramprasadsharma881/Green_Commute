import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  IndianRupee,
  Leaf,
  Star,
  Zap,
  Target,
  Route,
} from 'lucide-react';
import { storage, Ride } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { getActiveRides, AppRide } from '@/services/firebaseService';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

interface MatchScore {
  ride: AppRide;
  score: number;
  reasons: string[];
}

const SmartMatch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('Sri Venkateswara College of Engineering, Bangalore (SVCE)');
  const [matches, setMatches] = useState<MatchScore[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [allRides, setAllRides] = useState<AppRide[]>([]);

  // Load rides from Firestore on component mount
  useEffect(() => {
    const loadRides = async () => {
      try {
        const rides = await getActiveRides();
        setAllRides(rides);
        console.log('✅ Loaded', rides.length, 'rides for Smart Match');
      } catch (error) {
        console.error('❌ Error loading rides:', error);
      }
    };
    loadRides();
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // AI-Inspired Smart Matching Algorithm
  const calculateMatchScore = (ride: AppRide): MatchScore => {
    let score = 0;
    const reasons: string[] = [];

    // Extract location keywords (city, area names)
    const extractKeywords = (location: string) => {
      return location.toLowerCase()
        .split(',')
        .map(part => part.trim())
        .filter(part => part.length > 2);
    };

    const sourceKeywords = extractKeywords(source);
    const destKeywords = extractKeywords(destination);
    const rideSourceKeywords = extractKeywords(ride.source);
    const rideDestKeywords = extractKeywords(ride.destination);

    // Check source matching
    const sourceMatches = sourceKeywords.some(keyword => 
      rideSourceKeywords.some(rideKeyword => 
        rideKeyword.includes(keyword) || keyword.includes(rideKeyword)
      )
    );

    // Check destination matching
    const destMatches = destKeywords.some(keyword => 
      rideDestKeywords.some(rideKeyword => 
        rideKeyword.includes(keyword) || keyword.includes(rideKeyword)
      )
    );

    // STRICT: Both source AND destination must match for the ride to be relevant
    if (!sourceMatches || !destMatches) {
      return { ride, score: 0, reasons: [] }; // Reject immediately if route doesn't match
    }

    // Route similarity score (0-40 points)
    // Check how closely the locations match
    const exactSourceMatch = sourceKeywords.some(keyword => 
      rideSourceKeywords.some(rideKeyword => rideKeyword === keyword)
    );
    const exactDestMatch = destKeywords.some(keyword => 
      rideDestKeywords.some(rideKeyword => rideKeyword === keyword)
    );

    if (exactSourceMatch && exactDestMatch) {
      score += 40;
      reasons.push('🎯 Exact route match');
    } else if (sourceMatches && destMatches) {
      score += 25;
      reasons.push('📍 Relevant route match');
    }

    // Time optimization (0-20 points)
    const rideDate = ride.dateTime?.toDate ? ride.dateTime.toDate() : new Date(ride.dateTime);
    const now = new Date();
    const hoursUntilRide = (rideDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilRide > 0 && hoursUntilRide < 24) {
      score += 20;
      reasons.push('⏰ Optimal timing (within 24h)');
    } else if (hoursUntilRide >= 24 && hoursUntilRide < 72) {
      score += 10;
      reasons.push('🕐 Good timing (within 3 days)');
    }

    // Driver rating (0-15 points) - Skip if not available
    const driverRating = (ride as any).driverRating || 5.0;
    if (driverRating >= 4.8) {
      score += 15;
      reasons.push('⭐ Highly rated driver');
    } else if (driverRating >= 4.5) {
      score += 10;
      reasons.push('👍 Good driver rating');
    }

    // Seat availability (0-10 points)
    if (ride.availableSeats >= 3) {
      score += 10;
      reasons.push('💺 Multiple seats available');
    } else if (ride.availableSeats >= 1) {
      score += 5;
      reasons.push('🪑 Seats available');
    }

    // Price efficiency (0-10 points)
    if (ride.pricePerSeat <= 12) {
      score += 10;
      reasons.push('💰 Budget-friendly');
    } else if (ride.pricePerSeat <= 18) {
      score += 5;
      reasons.push('💵 Fair price');
    }

    // Environmental impact (0-5 points)
    if (ride.co2Saved > 2.5) {
      score += 5;
      reasons.push('🌿 High eco-impact');
    }

    return { ride, score, reasons };
  };

  const handleSmartMatch = async () => {
    if (!source || !destination) {
      toast({
        title: 'Missing information',
        description: 'Please enter both pickup and destination locations',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate AI analysis with progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Calculate match scores from Firestore rides
    // Minimum score threshold: 40 points (ensures both locations match + at least one other criterion)
    const scoredRides = allRides
      .map(calculateMatchScore)
      .filter((match) => match.score >= 40) // STRICT: Only show high-quality matches
      .sort((a, b) => b.score - a.score);

    setMatches(scoredRides);
    setAnalysisProgress(100);
    setIsAnalyzing(false);

    toast({
      title: 'Smart matching complete! ✨',
      description: `Found ${scoredRides.length} optimized ride matches`,
    });
  };

  const getMatchQuality = (score: number) => {
    if (score >= 80) return { label: 'Excellent Match', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (score >= 60) return { label: 'Great Match', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (score >= 40) return { label: 'Good Match', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    return { label: 'Possible Match', color: 'text-gray-500', bg: 'bg-gray-500/10' };
  };

  const formatDate = (dateTime: any) => {
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateTime: any) => {
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary text-white p-6 pb-24">
        <div className="container max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/10 mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-2xl font-bold">AI Smart Match</h1>
          </div>
          <p className="text-white/80 text-sm">
            Intelligent ride matching powered by smart algorithms
          </p>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-6 -mt-16">
        {/* Search Card */}
        <Card className="p-6 mb-6 shadow-eco">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source">From</Label>
              <LocationAutocomplete
                value={source}
                onChange={setSource}
                placeholder="Enter pickup location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">To (Fixed Destination)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-primary" />
                <Input
                  id="destination"
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

            <Button
              onClick={handleSmartMatch}
              disabled={isAnalyzing}
              className="w-full gradient-primary h-12"
            >
              {isAnalyzing ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Find Smart Matches
                </>
              )}
            </Button>

            {isAnalyzing && (
              <div className="space-y-2">
                <Progress value={analysisProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  AI analyzing {analysisProgress}% complete...
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* AI Features Info */}
        {!isAnalyzing && matches.length === 0 && (
          <Card className="p-6 mb-6 gradient-card">
            <h3 className="font-semibold text-foreground mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-primary" />
              Smart Matching Features
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-start space-x-2">
                <Route className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-muted-foreground">Route optimization</span>
              </div>
              <div className="flex items-start space-x-2">
                <Clock className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-muted-foreground">Time matching</span>
              </div>
              <div className="flex items-start space-x-2">
                <Star className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-muted-foreground">Driver ratings</span>
              </div>
              <div className="flex items-start space-x-2">
                <IndianRupee className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-muted-foreground">Price efficiency</span>
              </div>
              <div className="flex items-start space-x-2">
                <Leaf className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-muted-foreground">Eco-impact</span>
              </div>
              <div className="flex items-start space-x-2">
                <Target className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-muted-foreground">Preference matching</span>
              </div>
            </div>
          </Card>
        )}

        {/* Results */}
        {matches.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {matches.length} Smart Matches Found
              </h2>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>Sorted by relevance</span>
              </Badge>
            </div>

            {matches.map(({ ride, score, reasons }, index) => {
              const quality = getMatchQuality(score);
              return (
                <Card
                  key={ride.id}
                  className="p-5 hover-lift cursor-pointer relative overflow-hidden"
                  onClick={() => navigate(`/ride/${ride.id}`)}
                >
                  {/* Match Score Badge */}
                  <div className="absolute top-3 right-3">
                    <div className={`px-3 py-1 rounded-full ${quality.bg}`}>
                      <span className={`text-xs font-bold ${quality.color}`}>
                        {score}% Match
                      </span>
                    </div>
                  </div>

                  {/* Rank Badge for Top 3 */}
                  {index < 3 && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary">
                        #{index + 1} Best Match
                      </Badge>
                    </div>
                  )}

                  <div className="mt-8">
                    {/* Driver Info */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {ride.driverName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground">
                          {ride.driverName}
                        </h3>
                        <div className="flex items-center space-x-1 text-sm">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-muted-foreground">{ride.driverRating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium text-card-foreground">
                          {ride.source}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Navigation className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium text-card-foreground">
                          {ride.destination}
                        </span>
                      </div>
                    </div>

                    {/* Match Reasons */}
                    <div className="mb-4 space-y-1">
                      {reasons.slice(0, 3).map((reason, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground flex items-center space-x-1">
                          <span>✓</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>

                    {/* Details */}
                    <div className="flex items-center justify-between text-sm border-t border-border pt-4">
                      <div className="flex items-center space-x-4 text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(ride.dateTime)} {formatTime(ride.dateTime)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{ride.availableSeats} seats</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1 text-primary">
                          <Leaf className="w-3 h-3" />
                          <span className="font-medium">{ride.co2Saved} kg</span>
                        </span>
                        <span className="text-lg font-bold text-primary">
                          ₹{ride.pricePerSeat}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {!isAnalyzing && matches.length === 0 && source && destination && (
          <Card className="p-12 text-center">
            <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2 text-foreground">
              No matches found
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Try adjusting your search criteria or check back later
            </p>
            <Button
              onClick={() => navigate('/find-ride')}
              variant="outline"
            >
              Browse All Rides
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SmartMatch;
