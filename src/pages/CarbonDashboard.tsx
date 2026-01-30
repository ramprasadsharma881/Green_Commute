import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Leaf,
  Trophy,
  Gift,
  TrendingUp,
  Award,
  TreePine,
  Sparkles,
  Crown,
  Star,
  Zap,
  Heart,
  Target,
  Coins,
  Medal,
} from 'lucide-react';
import { storage } from '@/lib/storage';
import type { CarbonStats, Achievement, Reward } from '@/types/carbon';

export default function CarbonDashboard() {
  const user = storage.get('current_user');
  const [stats, setStats] = useState<CarbonStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadCarbonData();
  }, []);

  const loadCarbonData = () => {
    // Mock data - in production, fetch from API
    const mockStats: CarbonStats = {
      balance: 450,
      totalEarned: 1250,
      totalRedeemed: 800,
      level: { level: 4, name: 'Eco Warrior', next: 2500 },
      totalRides: 45,
      co2Saved: 235,
      achievementsUnlocked: 12,
      rewardsRedeemed: 5,
      treesPlanted: 8,
    };

    const mockAchievements: Achievement[] = [
      {
        id: 'first_ride',
        name: 'First Journey',
        description: 'Complete your first ride',
        icon: '🚗',
        category: 'rides',
        requirementType: 'ride_count',
        requirementValue: 1,
        carbonCreditReward: 10,
        tier: 'bronze',
        unlocked: true,
        earnedAt: '2024-01-15',
        progress: 100,
        currentValue: 45,
      },
      {
        id: 'ride_warrior',
        name: 'Ride Warrior',
        description: 'Complete 10 rides',
        icon: '🏃',
        category: 'rides',
        requirementType: 'ride_count',
        requirementValue: 10,
        carbonCreditReward: 50,
        tier: 'silver',
        unlocked: true,
        earnedAt: '2024-02-20',
        progress: 100,
        currentValue: 45,
      },
      {
        id: 'veteran_commuter',
        name: 'Veteran Commuter',
        description: 'Complete 50 rides',
        icon: '🎖️',
        category: 'rides',
        requirementType: 'ride_count',
        requirementValue: 50,
        carbonCreditReward: 200,
        tier: 'gold',
        unlocked: false,
        progress: 90,
        currentValue: 45,
      },
      {
        id: 'eco_warrior',
        name: 'Eco Warrior',
        description: 'Save 100 kg CO₂',
        icon: '🌿',
        category: 'co2',
        requirementType: 'co2_saved',
        requirementValue: 100,
        carbonCreditReward: 100,
        tier: 'silver',
        unlocked: true,
        earnedAt: '2024-03-10',
        progress: 100,
        currentValue: 235,
      },
      {
        id: 'climate_hero',
        name: 'Climate Hero',
        description: 'Save 500 kg CO₂',
        icon: '🌳',
        category: 'co2',
        requirementType: 'co2_saved',
        requirementValue: 500,
        carbonCreditReward: 300,
        tier: 'gold',
        unlocked: false,
        progress: 47,
        currentValue: 235,
      },
      {
        id: 'tree_planter',
        name: 'Tree Planter',
        description: 'Plant your first tree',
        icon: '🌲',
        category: 'special',
        requirementType: 'trees_planted',
        requirementValue: 1,
        carbonCreditReward: 50,
        tier: 'silver',
        unlocked: true,
        earnedAt: '2024-04-05',
        progress: 100,
        currentValue: 8,
      },
    ];

    const mockRewards: Reward[] = [
      {
        id: 'reward_1',
        title: '10% Off Next Ride',
        description: 'Get 10% discount on your next ride booking',
        category: 'discount',
        carbonCreditCost: 50,
        partnerName: 'Eco Commute',
        discountPercentage: 10,
        isActive: true,
      },
      {
        id: 'reward_2',
        title: '25% Off Next Ride',
        description: 'Get 25% discount on your next ride booking',
        category: 'discount',
        carbonCreditCost: 100,
        partnerName: 'Eco Commute',
        discountPercentage: 25,
        isActive: true,
      },
      {
        id: 'reward_4',
        title: 'Plant 5 Trees',
        description: 'Plant 5 trees in your name through our partner organizations',
        category: 'tree_planting',
        carbonCreditCost: 150,
        partnerName: 'TreeNation',
        isActive: true,
      },
      {
        id: 'reward_6',
        title: 'Eco Commute T-Shirt',
        description: 'Exclusive Eco Commute branded organic cotton t-shirt',
        category: 'merchandise',
        carbonCreditCost: 300,
        partnerName: 'Eco Commute',
        stockAvailable: 100,
        isActive: true,
      },
    ];

    setStats(mockStats);
    setAchievements(mockAchievements);
    setRewards(mockRewards);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-orange-600 bg-orange-100 dark:bg-orange-950';
      case 'silver': return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
      case 'gold': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950';
      case 'platinum': return 'text-purple-600 bg-purple-100 dark:bg-purple-950';
      case 'diamond': return 'text-blue-600 bg-blue-100 dark:bg-blue-950';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rides': return <Zap className="w-4 h-4" />;
      case 'distance': return <TrendingUp className="w-4 h-4" />;
      case 'co2': return <Leaf className="w-4 h-4" />;
      case 'social': return <Heart className="w-4 h-4" />;
      case 'special': return <Sparkles className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  if (!user || !stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Leaf className="w-10 h-10 text-green-600" />
          Carbon Credit Center
        </h1>
        <p className="text-muted-foreground">
          Track your environmental impact and earn rewards for sustainable commuting
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Carbon Credits</p>
              <p className="text-3xl font-bold text-green-600">{stats.balance}</p>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.totalEarned} earned • -{stats.totalRedeemed} redeemed
              </p>
            </div>
            <Coins className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Level</p>
              <p className="text-2xl font-bold text-blue-600">{stats.level.name}</p>
              <div className="mt-2">
                <Progress value={(stats.totalEarned / (stats.level.next || 1)) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalEarned} / {stats.level.next}
                </p>
              </div>
            </div>
            <Crown className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Achievements</p>
              <p className="text-3xl font-bold text-purple-600">{stats.achievementsUnlocked}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {achievements.length} available
              </p>
            </div>
            <Trophy className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Trees Planted</p>
              <p className="text-3xl font-bold text-orange-600">{stats.treesPlanted}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.co2Saved} kg CO₂ saved
              </p>
            </div>
            <TreePine className="w-12 h-12 text-orange-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Your Impact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-4xl font-bold text-green-600">{stats.totalRides}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Rides</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-4xl font-bold text-blue-600">{stats.co2Saved} kg</p>
                <p className="text-sm text-muted-foreground mt-1">CO₂ Saved</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <p className="text-4xl font-bold text-purple-600">{stats.rewardsRedeemed}</p>
                <p className="text-sm text-muted-foreground mt-1">Rewards Redeemed</p>
              </div>
            </div>
          </Card>

          {/* Level Progress */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Level Progress
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Level {stats.level.level}: {stats.level.name}</span>
                <Badge className="bg-blue-600 text-white">Active</Badge>
              </div>
              <Progress value={(stats.totalEarned / (stats.level.next || 1)) * 100} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {stats.totalEarned} / {stats.level.next} credits to next level
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {[1, 2, 3, 4, 5, 6, 7].map((level) => (
                  <div
                    key={level}
                    className={`p-3 rounded-lg text-center ${
                      level <= stats.level.level
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-600'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <p className="font-bold">Level {level}</p>
                    {level === stats.level.level && (
                      <Badge className="mt-1 text-xs">Current</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`p-5 ${
                  achievement.unlocked
                    ? 'border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'
                    : 'opacity-75'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getTierColor(achievement.tier)}>
                      {achievement.tier}
                    </Badge>
                    {achievement.unlocked && (
                      <Badge className="bg-green-600 text-white">
                        <Award className="w-3 h-3 mr-1" />
                        Unlocked
                      </Badge>
                    )}
                  </div>
                </div>
                <h4 className="font-semibold text-lg mb-1">{achievement.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                
                {!achievement.unlocked && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progress</span>
                      <span className="font-medium">
                        {achievement.currentValue} / {achievement.requirementValue}
                      </span>
                    </div>
                    <Progress value={achievement.progress} className="h-2" />
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Reward</span>
                  <Badge className="bg-green-600 text-white">
                    <Coins className="w-3 h-3 mr-1" />
                    {achievement.carbonCreditReward} credits
                  </Badge>
                </div>
                
                {achievement.unlocked && achievement.earnedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Earned on {new Date(achievement.earnedAt).toLocaleDateString()}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-1">Available Balance</h3>
                <p className="text-4xl font-bold text-purple-600">{stats.balance} Credits</p>
              </div>
              <Gift className="w-16 h-16 text-purple-600 opacity-20" />
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward) => {
              const canAfford = stats.balance >= reward.carbonCreditCost;
              
              return (
                <Card key={reward.id} className={`p-6 ${!canAfford ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <Badge className={
                      reward.category === 'tree_planting' ? 'bg-green-600' :
                      reward.category === 'discount' ? 'bg-blue-600' :
                      reward.category === 'merchandise' ? 'bg-purple-600' :
                      'bg-orange-600'
                    }>
                      {reward.category.replace('_', ' ')}
                    </Badge>
                    {reward.partnerName && (
                      <span className="text-xs text-muted-foreground">{reward.partnerName}</span>
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-lg mb-2">{reward.title}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>
                  
                  {reward.stockAvailable !== undefined && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {reward.stockAvailable} left in stock
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold">{reward.carbonCreditCost}</span>
                    </div>
                    <Button 
                      disabled={!canAfford}
                      className={canAfford ? '' : 'opacity-50'}
                    >
                      {canAfford ? 'Redeem' : 'Insufficient Credits'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
