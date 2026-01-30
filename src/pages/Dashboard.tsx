import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Search,
  Plus,
  Leaf,
  TrendingUp,
  User,
  LogOut,
  Award,
  Clock,
  Trophy,
  Wallet,
  History,
  Sparkles,
  Shield,
  Share2,
  Users,
  Gift,
  Target,
  Copy,
  AlertTriangle,
} from 'lucide-react';
import { initializeDemoData } from '@/lib/storage';
import { NotificationBell } from '@/components/NotificationBell';
import SOSButton from '@/components/SOSButton';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
    } else {
      initializeDemoData();
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  const greenLevel = user.greenScore < 100 ? 'Eco Starter' : 
                     user.greenScore < 500 ? 'Green Commuter' : 
                     user.greenScore < 1000 ? 'Sustainability Champion' : 'Eco Warrior';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary text-white p-6 pb-24">
        <div className="container max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-white/80">Welcome back,</p>
                <h1 className="text-xl font-bold">{user.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-white">
                <NotificationBell />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-white hover:bg-white/10"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Green Score Card */}
          <Card className="bg-white/10 backdrop-blur border-white/20 p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span className="font-semibold">Green Score</span>
              </div>
              <span className="text-sm opacity-80">{greenLevel}</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">{user.greenScore}</p>
                <p className="text-sm opacity-80 mt-1">Points earned</p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-60" />
            </div>
          </Card>
        </div>
      </header>

      {/* Main Content */}
      <div className="container max-w-2xl mx-auto px-6 -mt-16">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link to="/smart-match">
            <Card className="p-6 hover-lift gradient-card cursor-pointer relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-card-foreground mb-1">AI Smart Match</h3>
              <p className="text-xs text-muted-foreground">Intelligent ride matching</p>
            </Card>
          </Link>

          <Link to="/offer-ride">
            <Card className="p-6 hover-lift gradient-card cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-card-foreground mb-1">Offer a Ride</h3>
              <p className="text-xs text-muted-foreground">Share your journey</p>
            </Card>
          </Link>
        </div>

        {/* Stats Grid */}
        <Link to="/eco-impact">
          <Card className="p-6 mb-8 gradient-card hover-lift cursor-pointer bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                  <Leaf className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Your Eco Impact</p>
                  <p className="text-3xl font-bold text-green-600">{user.co2Saved} kg CO₂</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    🌳 Equivalent to {Math.floor(user.co2Saved / 20)} trees planted
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">View Details →</p>
              </div>
            </div>
          </Card>
        </Link>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center gradient-card">
            <Leaf className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-card-foreground">{user.co2Saved}</p>
            <p className="text-xs text-muted-foreground">kg CO₂ Saved</p>
          </Card>

          <Card className="p-4 text-center gradient-card">
            <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-card-foreground">{user.totalRides}</p>
            <p className="text-xs text-muted-foreground">Total Rides</p>
          </Card>

          <Card className="p-4 text-center gradient-card">
            <Award className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-card-foreground">{user.rating}</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </Card>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link to="/my-rides">
            <Card className="p-4 hover-lift cursor-pointer text-center">
              <History className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-card-foreground">My Rides</p>
            </Card>
          </Link>

          <Link to="/safety">
            <Card className="p-4 hover-lift cursor-pointer text-center">
              <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-card-foreground">Safety Center</p>
            </Card>
          </Link>

          <Link to="/leaderboard">
            <Card className="p-4 hover-lift cursor-pointer text-center">
              <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-card-foreground">Leaderboard</p>
            </Card>
          </Link>

          <Link to="/wallet">
            <Card className="p-4 hover-lift cursor-pointer text-center">
              <Wallet className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-card-foreground">Wallet</p>
            </Card>
          </Link>
        </div>

        {/* Social Features */}
        <Card className="p-6 mb-8">
          <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Social & Challenges
          </h3>
          
          {/* Referral Card */}
          <Card className="p-4 mb-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold">Refer Friends, Get Rewards!</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Share your referral code and earn 100 carbon credits for each friend who joins
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-background rounded border border-border font-mono text-sm">
                    ECO-{user.id.slice(0, 6).toUpperCase()}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`ECO-${user.id.slice(0, 6).toUpperCase()}`);
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Community Challenges */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-600" />
              Active Challenges
            </h4>
            
            <Card className="p-4 hover-lift cursor-pointer border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-sm">November Green Commute</h5>
                <Award className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">Complete 20 rides this month</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>{user.totalRides}/20 rides</span>
                  <span className="font-medium text-orange-600">{Math.round((user.totalRides/20)*100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 transition-all"
                    style={{ width: `${Math.min((user.totalRides/20)*100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Trophy className="w-3 h-3 text-yellow-600" />
                <span className="text-xs font-medium">Reward: 200 credits</span>
              </div>
            </Card>

            <Card className="p-4 hover-lift cursor-pointer border-l-4 border-l-green-500">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-sm">Carbon Crusher</h5>
                <Leaf className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">Save 50 kg of CO₂ this month</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>{user.co2Saved}/50 kg CO₂</span>
                  <span className="font-medium text-green-600">{Math.round((user.co2Saved/50)*100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${Math.min((user.co2Saved/50)*100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Trophy className="w-3 h-3 text-yellow-600" />
                <span className="text-xs font-medium">Reward: 150 credits</span>
              </div>
            </Card>

            <Link to="/carbon">
              <Button variant="outline" className="w-full" size="sm">
                View All Challenges →
              </Button>
            </Link>
          </div>

          {/* Social Share */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-600" />
              Share Your Impact
            </h4>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent('I\'m saving the planet with GreenCommute! 🌱 Join me in reducing carbon emissions through eco-friendly ride sharing. #GreenCommute #SaveThePlanet')}`, '_blank')}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('I\'m saving the planet with GreenCommute! 🌱🚗 Join me in reducing carbon emissions through eco-friendly ride sharing. #GreenCommute #SaveThePlanet #EcoFriendly')}&url=${encodeURIComponent(window.location.origin)}`, '_blank')}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('🌱 I\'m saving the planet with GreenCommute! Join me in reducing carbon emissions through eco-friendly ride sharing. Check it out: ' + window.location.origin)}`, '_blank')}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </Button>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 mb-8">
          <h3 className="font-semibold text-card-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-card-foreground">Welcome to GreenCommute!</p>
                <p className="text-xs text-muted-foreground">Account created</p>
              </div>
              <Leaf className="w-5 h-5 text-primary" />
            </div>
          </div>
        </Card>

        {/* Emergency SOS Footer */}
        <Link to="/safety">
          <Card className="p-6 mb-8 border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 hover-lift cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-700 dark:text-red-400 text-lg">Emergency SOS</h3>
                  <p className="text-sm text-red-600 dark:text-red-500">Quick access to emergency assistance</p>
                </div>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
