import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Leaf,
  TreePine,
  Car,
  Bike,
  Bus,
  Train,
  Zap,
  TrendingUp,
  Award,
  Share2,
  Target,
  Globe,
  Heart,
  Sparkles,
  CheckCircle2,
  Lock,
  Trophy,
  Flame,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/storage';
import { calculateUserEcoStreak, updateUserStats } from '@/services/firebaseService';

interface EcoChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  icon: string;
  completed: boolean;
}

const EcoImpact = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [treesPlanted, setTreesPlanted] = useState(0);
  const [ecoStreak, setEcoStreak] = useState(0);
  const [isLoadingStreak, setIsLoadingStreak] = useState(true);
  const [selectedTransport, setSelectedTransport] = useState('car');
  const [distance, setDistance] = useState(10);

  // Load real eco streak on mount
  useEffect(() => {
    if (user) {
      loadEcoStreak();
    }
  }, [user]);

  const loadEcoStreak = async () => {
    if (!user) return;
    
    try {
      setIsLoadingStreak(true);
      const streak = await calculateUserEcoStreak(user.id);
      setEcoStreak(streak);
    } catch (error) {
      console.error('Error loading eco streak:', error);
    } finally {
      setIsLoadingStreak(false);
    }
  };

  // Calculate environmental impact
  const co2Saved = user?.co2Saved || 0;
  const treesEquivalent = Math.floor(co2Saved / 20); // 1 tree absorbs ~20kg CO2/year
  const carsOffRoad = Math.floor(co2Saved / 100); // Average car emits ~100kg CO2/month
  const fuelSaved = Math.floor(co2Saved * 0.4); // ~0.4L fuel per kg CO2

  // Eco Challenges
  const [challenges, setChallenges] = useState<EcoChallenge[]>([
    {
      id: '1',
      title: 'Green Warrior',
      description: 'Save 50kg of CO₂',
      target: 50,
      current: co2Saved,
      reward: 100,
      icon: 'leaf',
      completed: co2Saved >= 50,
    },
    {
      id: '2',
      title: 'Carpool Champion',
      description: 'Complete 10 shared rides',
      target: 10,
      current: user?.totalRides || 0,
      reward: 150,
      icon: 'users',
      completed: (user?.totalRides || 0) >= 10,
    },
    {
      id: '3',
      title: 'Tree Hugger',
      description: 'Plant 5 virtual trees',
      target: 5,
      current: treesPlanted,
      reward: 200,
      icon: 'tree',
      completed: treesPlanted >= 5,
    },
    {
      id: '4',
      title: 'Eco Streak Master',
      description: 'Maintain 30-day eco streak',
      target: 30,
      current: ecoStreak,
      reward: 300,
      icon: 'flame',
      completed: ecoStreak >= 30,
    },
  ]);

  // Transport modes with emission factors (kg CO2 per km)
  const transportModes = [
    { id: 'car', name: 'Solo Car', icon: Car, emission: 0.192, color: 'text-red-500' },
    { id: 'carpool', name: 'Carpool', icon: Car, emission: 0.048, color: 'text-green-500' },
    { id: 'bike', name: 'Bike/Scooter', icon: Bike, emission: 0.084, color: 'text-orange-500' },
    { id: 'bus', name: 'Bus', icon: Bus, emission: 0.089, color: 'text-blue-500' },
    { id: 'train', name: 'Train', icon: Train, emission: 0.041, color: 'text-purple-500' },
  ];

  // Calculate emissions for comparison
  const calculateEmission = (mode: string, dist: number) => {
    const transport = transportModes.find((t) => t.id === mode);
    return transport ? (transport.emission * dist).toFixed(2) : '0';
  };

  const carpoolEmission = parseFloat(calculateEmission('carpool', distance));
  const soloCarEmission = parseFloat(calculateEmission('car', distance));
  const savingsVsCar = ((soloCarEmission - carpoolEmission) / soloCarEmission * 100).toFixed(0);

  // Plant a tree
  const handlePlantTree = async () => {
    if (co2Saved < 20) {
      toast({
        title: 'Not enough CO₂ saved',
        description: 'Save 20kg CO₂ to plant a tree!',
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setTreesPlanted((prev) => prev + 1);
    
    // Deduct CO2 and add green score bonus
    await updateUserStats(user.id, {
      co2Saved: -20, // Deduct 20kg CO2
      greenScore: 50  // Bonus points for planting a tree
    });

    toast({
      title: '🌳 Tree Planted!',
      description: 'You planted a virtual tree! +50 Green Score',
    });
  };

  // Share achievement
  const handleShare = () => {
    const text = `I've saved ${co2Saved}kg of CO₂ using GreenCommute! 🌍💚 Join me in making our planet greener! #GreenCommute #EcoFriendly`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Eco Impact - GreenCommute',
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard!',
        description: 'Share your eco impact on social media',
      });
    }
  };

  // Eco tips
  const ecoTips = [
    {
      title: 'Share Your Commute',
      description: 'Carpooling reduces emissions by 75% compared to driving alone!',
      icon: Car,
    },
    {
      title: 'Plan Ahead',
      description: 'Schedule rides in advance to maximize carpool efficiency.',
      icon: Target,
    },
    {
      title: 'Keep Momentum',
      description: 'Daily eco-friendly rides create lasting environmental impact.',
      icon: Zap,
    },
    {
      title: 'Spread the Word',
      description: 'Invite friends! More carpoolers = cleaner air for everyone.',
      icon: Heart,
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="gradient-primary text-white p-6">
        <div className="container max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/10 mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Eco Impact Dashboard</h1>
              <p className="text-white/80 text-sm">Track your environmental contribution</p>
            </div>
            <Leaf className="w-12 h-12 opacity-20" />
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Hero Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 gradient-card hover-lift">
            <Leaf className="w-8 h-8 text-primary mb-2" />
            <p className="text-2xl font-bold text-card-foreground">{co2Saved} kg</p>
            <p className="text-xs text-muted-foreground">CO₂ Saved</p>
          </Card>

          <Card className="p-4 gradient-card hover-lift">
            <TreePine className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold text-card-foreground">{treesEquivalent}</p>
            <p className="text-xs text-muted-foreground">Trees Equivalent</p>
          </Card>

          <Card className="p-4 gradient-card hover-lift">
            <Car className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-card-foreground">{carsOffRoad}</p>
            <p className="text-xs text-muted-foreground">Cars Off Road</p>
          </Card>

          <Card className="p-4 gradient-card hover-lift">
            <Zap className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="text-2xl font-bold text-card-foreground">{fuelSaved}L</p>
            <p className="text-xs text-muted-foreground">Fuel Saved</p>
          </Card>
        </div>

        {/* Eco Streak */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Eco Streak</h3>
                <p className="text-sm text-muted-foreground">
                  {isLoadingStreak ? 'Calculating...' : 'Keep the momentum going!'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {isLoadingStreak ? (
                <div className="animate-pulse">
                  <div className="h-8 w-12 bg-muted rounded"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-orange-500">{ecoStreak}</p>
                  <p className="text-xs text-muted-foreground">days</p>
                </>
              )}
            </div>
          </div>
          <Progress value={(ecoStreak / 30) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {ecoStreak >= 30 
              ? '🎉 Eco Streak Master achieved!' 
              : `${30 - ecoStreak} days to Eco Streak Master achievement!`}
          </p>
        </Card>

        <Tabs defaultValue="impact" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="impact">Impact</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
          </TabsList>

          {/* Impact Tab */}
          <TabsContent value="impact" className="space-y-6 mt-6">
            {/* Tree Planting Program */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <TreePine className="w-10 h-10 text-green-600" />
                  <div>
                    <h3 className="font-bold text-lg">Plant Virtual Trees</h3>
                    <p className="text-sm text-muted-foreground">
                      Convert CO₂ savings into trees
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-600 text-white">{treesPlanted} Planted</Badge>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-20 rounded-lg flex items-center justify-center ${
                      i < treesPlanted
                        ? 'bg-green-600 text-white'
                        : 'bg-muted border-2 border-dashed'
                    }`}
                  >
                    <TreePine className={`w-8 h-8 ${i < treesPlanted ? '' : 'text-muted-foreground'}`} />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Cost: 20kg CO₂ per tree • Available: {Math.floor(co2Saved / 20)} trees
                </p>
                <Button
                  onClick={handlePlantTree}
                  disabled={co2Saved < 20}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <TreePine className="w-4 h-4 mr-2" />
                  Plant Tree
                </Button>
              </div>
            </Card>

            {/* Monthly Impact Trend */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                Your Environmental Impact
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">CO₂ Reduction</span>
                    <span className="text-sm font-bold text-primary">{co2Saved} kg</span>
                  </div>
                  <Progress value={Math.min((co2Saved / 100) * 100, 100)} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Globe className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{user.totalRides}</p>
                    <p className="text-xs text-muted-foreground">Shared Rides</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{user.greenScore}</p>
                    <p className="text-xs text-muted-foreground">Green Score</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Share Achievement */}
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Share Your Impact</h3>
                    <p className="text-sm text-muted-foreground">
                      Inspire others to go green!
                    </p>
                  </div>
                </div>
                <Button onClick={handleShare} variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </Card>

            {/* Eco Tips */}
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                Eco-Friendly Tips
              </h3>
              <div className="grid gap-3">
                {ecoTips.map((tip, index) => (
                  <Card key={index} className="p-4 hover-lift cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <tip.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">{tip.title}</h4>
                        <p className="text-xs text-muted-foreground">{tip.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-4 mt-6">
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2">Eco Challenges</h3>
              <p className="text-sm text-muted-foreground">
                Complete challenges to earn rewards and boost your Green Score!
              </p>
            </div>

            {challenges.map((challenge) => (
              <Card key={challenge.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        challenge.completed
                          ? 'bg-green-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {challenge.completed ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : challenge.icon === 'leaf' ? (
                        <Leaf className="w-6 h-6" />
                      ) : challenge.icon === 'tree' ? (
                        <TreePine className="w-6 h-6" />
                      ) : challenge.icon === 'flame' ? (
                        <Flame className="w-6 h-6" />
                      ) : (
                        <Trophy className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{challenge.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {challenge.description}
                      </p>
                      <Badge variant="secondary">+{challenge.reward} Green Score</Badge>
                    </div>
                  </div>
                  {challenge.completed && (
                    <Badge className="bg-green-500 text-white">Completed</Badge>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {challenge.current} / {challenge.target}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.min(Math.floor((challenge.current / challenge.target) * 100), 100)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min((challenge.current / challenge.target) * 100, 100)}
                    className="h-2"
                  />
                </div>
              </Card>
            ))}

            {/* Locked Challenge */}
            <Card className="p-6 bg-muted/50 border-dashed">
              <div className="flex items-center justify-between opacity-60">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">More Challenges Coming</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete current challenges to unlock more!
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Compare Tab */}
          <TabsContent value="compare" className="space-y-6 mt-6">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Transport Mode Comparison</h3>
              <p className="text-sm text-muted-foreground mb-6">
                See how carpooling reduces your carbon footprint
              </p>

              {/* Distance Input */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Distance (km)</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={distance}
                  onChange={(e) => setDistance(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1 km</span>
                  <span className="font-bold text-primary">{distance} km</span>
                  <span>50 km</span>
                </div>
              </div>

              {/* Comparison Cards */}
              <div className="space-y-3">
                {transportModes.map((mode) => {
                  const emission = calculateEmission(mode.id, distance);
                  const Icon = mode.icon;
                  return (
                    <Card
                      key={mode.id}
                      className={`p-4 cursor-pointer transition-all ${
                        mode.id === 'carpool'
                          ? 'border-2 border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-6 h-6 ${mode.color}`} />
                          <div>
                            <p className="font-semibold">{mode.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {mode.emission} kg CO₂/km
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">{emission} kg</p>
                          <p className="text-xs text-muted-foreground">CO₂ emissions</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Savings Highlight */}
              <Card className="p-6 mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <div className="text-center">
                  <Leaf className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h4 className="font-bold text-2xl text-green-600 mb-2">
                    {savingsVsCar}% Less Emissions
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    By carpooling instead of driving alone, you save{' '}
                    <span className="font-bold text-green-600">
                      {(soloCarEmission - carpoolEmission).toFixed(2)} kg CO₂
                    </span>{' '}
                    per trip!
                  </p>
                </div>
              </Card>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EcoImpact;
