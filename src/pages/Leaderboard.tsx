import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Trophy,
  Leaf,
  TrendingUp,
  Crown,
  Medal,
  Award,
  Zap,
  Target,
  Star,
  Calendar,
} from 'lucide-react';
import { storage, User } from '@/lib/storage';

interface LeaderboardEntry {
  user: User;
  rank: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadLeaderboards();
  }, [user, navigate]);

  const loadLeaderboards = () => {
    const allUsers = storage.get<{ [key: string]: User }>('users:all') || {};
    const usersArray = Object.values(allUsers);

    // Sort by green score for all leaderboards
    const sortedUsers = usersArray.sort((a, b) => b.greenScore - a.greenScore);

    // Create leaderboard entries with ranks
    const leaderboardEntries: LeaderboardEntry[] = sortedUsers.map((user, index) => ({
      user,
      rank: index + 1,
    }));

    // For demo purposes, use the same data for all time periods
    setAllTimeLeaderboard(leaderboardEntries);
    setMonthlyLeaderboard(leaderboardEntries);
    setWeeklyLeaderboard(leaderboardEntries);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30';
      default:
        return '';
    }
  };

  const getGreenLevel = (score: number) => {
    if (score < 100) return { level: 'Eco Starter', icon: '🌱' };
    if (score < 500) return { level: 'Green Commuter', icon: '🌿' };
    if (score < 1000) return { level: 'Sustainability Champion', icon: '🌳' };
    return { level: 'Eco Warrior', icon: '🏆' };
  };

  const LeaderboardList = ({ entries }: { entries: LeaderboardEntry[] }) => (
    <div className="space-y-3">
      {entries.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No data available yet</p>
        </Card>
      ) : (
        entries.map(({ user: entryUser, rank }) => {
          const { level, icon } = getGreenLevel(entryUser.greenScore);
          const isCurrentUser = user?.id === entryUser.id;

          return (
            <Card
              key={entryUser.id}
              className={`p-4 transition-all hover-lift ${getRankBg(rank)} ${
                isCurrentUser ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* Rank */}
                <div className="flex-shrink-0 w-12 flex items-center justify-center">
                  {getRankIcon(rank)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-card-foreground truncate">
                      {entryUser.name}
                    </h3>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{icon}</span>
                    <span>{level}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex items-center space-x-1">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-bold text-lg text-primary">
                      {entryUser.greenScore}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Leaf className="w-3 h-3" />
                      <span>{entryUser.co2Saved}kg</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Target className="w-3 h-3" />
                      <span>{entryUser.totalRides}</span>
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );

  if (!user) return null;

  const userRank =
    allTimeLeaderboard.find((entry) => entry.user.id === user.id)?.rank || 0;
  const { level, icon } = getGreenLevel(user.greenScore);

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
            <Trophy className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-white/80 text-sm">
            Compete with eco-warriors worldwide
          </p>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-6 -mt-16">
        {/* User's Position Card */}
        <Card className="p-6 mb-6 shadow-eco bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Position</p>
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold text-primary">#{userRank}</span>
                <span className="text-2xl">{icon}</span>
              </div>
              <p className="text-sm font-medium text-foreground mt-1">{level}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Green Score</p>
              <p className="text-3xl font-bold text-primary">{user.greenScore}</p>
              <div className="flex items-center justify-end space-x-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <Leaf className="w-3 h-3" />
                  <span>{user.co2Saved}kg</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Target className="w-3 h-3" />
                  <span>{user.totalRides} rides</span>
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="all-time" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="weekly" className="text-xs sm:text-sm">
              <Calendar className="w-3 h-3 mr-1" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 mr-1" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="all-time" className="text-xs sm:text-sm">
              <Trophy className="w-3 h-3 mr-1" />
              All Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <LeaderboardList entries={weeklyLeaderboard} />
          </TabsContent>

          <TabsContent value="monthly">
            <LeaderboardList entries={monthlyLeaderboard} />
          </TabsContent>

          <TabsContent value="all-time">
            <LeaderboardList entries={allTimeLeaderboard} />
          </TabsContent>
        </Tabs>

        {/* Achievement Teaser */}
        <Card className="p-6 mt-6 mb-6 gradient-card">
          <div className="flex items-center space-x-3 mb-3">
            <Award className="w-6 h-6 text-primary" />
            <h3 className="font-semibold text-foreground">Keep Going!</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Complete more rides to earn achievements and climb the leaderboard!
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              Eco Starter
            </Badge>
            <Badge variant="outline" className="text-xs opacity-50">
              <Star className="w-3 h-3 mr-1" />
              Green Commuter
            </Badge>
            <Badge variant="outline" className="text-xs opacity-50">
              <Star className="w-3 h-3 mr-1" />
              Eco Warrior
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
