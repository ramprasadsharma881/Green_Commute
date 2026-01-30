import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Zap, Leaf, Trophy, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserStats } from '@/services/firebaseService';

const DevTools = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [co2Amount, setCo2Amount] = useState('10');
  const [ridesAmount, setRidesAmount] = useState('1');
  const [scoreAmount, setScoreAmount] = useState('50');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!user) {
    navigate('/');
    return null;
  }

  const handleUpdateStats = async (type: 'co2' | 'rides' | 'score' | 'all') => {
    try {
      setIsUpdating(true);

      const updates: any = {};

      if (type === 'co2' || type === 'all') {
        updates.co2Saved = parseFloat(co2Amount);
      }
      if (type === 'rides' || type === 'all') {
        updates.totalRides = parseInt(ridesAmount);
      }
      if (type === 'score' || type === 'all') {
        updates.greenScore = parseInt(scoreAmount);
      }

      await updateUserStats(user.id, updates);

      toast({
        title: '✅ Stats Updated!',
        description: 'Your profile stats have been updated successfully',
      });

      // Refresh page to show new stats
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error updating stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to update stats',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickBoost = async (preset: string) => {
    try {
      setIsUpdating(true);

      let updates: any = {};

      switch (preset) {
        case 'beginner':
          updates = { co2Saved: 25, totalRides: 5, greenScore: 100 };
          break;
        case 'intermediate':
          updates = { co2Saved: 100, totalRides: 20, greenScore: 500 };
          break;
        case 'expert':
          updates = { co2Saved: 500, totalRides: 100, greenScore: 2000 };
          break;
      }

      await updateUserStats(user.id, updates);

      toast({
        title: '🚀 Quick Boost Applied!',
        description: `${preset} level stats added to your profile`,
      });

      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error applying boost:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply boost',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
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
          <div className="flex items-center space-x-3">
            <Zap className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Dev Tools</h1>
              <p className="text-white/80 text-sm">Manually update your stats for testing</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Current Stats */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Current Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Leaf className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{user.co2Saved}</p>
              <p className="text-xs text-muted-foreground">kg CO₂</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{user.totalRides}</p>
              <p className="text-xs text-muted-foreground">Rides</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{user.greenScore}</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
          </div>
        </Card>

        {/* Quick Presets */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Quick Presets</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Instantly add predefined stat packages
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={() => handleQuickBoost('beginner')}
              disabled={isUpdating}
              variant="outline"
              className="flex-col h-auto py-4"
            >
              <span className="text-2xl mb-2">🌱</span>
              <span className="font-semibold">Beginner</span>
              <span className="text-xs text-muted-foreground">+25 CO₂, +5 rides</span>
            </Button>
            <Button
              onClick={() => handleQuickBoost('intermediate')}
              disabled={isUpdating}
              variant="outline"
              className="flex-col h-auto py-4"
            >
              <span className="text-2xl mb-2">🌿</span>
              <span className="font-semibold">Intermediate</span>
              <span className="text-xs text-muted-foreground">+100 CO₂, +20 rides</span>
            </Button>
            <Button
              onClick={() => handleQuickBoost('expert')}
              disabled={isUpdating}
              variant="outline"
              className="flex-col h-auto py-4"
            >
              <span className="text-2xl mb-2">🌳</span>
              <span className="font-semibold">Expert</span>
              <span className="text-xs text-muted-foreground">+500 CO₂, +100 rides</span>
            </Button>
          </div>
        </Card>

        {/* Manual Updates */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Manual Update</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Add specific amounts to your stats
          </p>

          <div className="space-y-4">
            {/* CO2 Input */}
            <div>
              <Label htmlFor="co2">CO₂ Saved (kg)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="co2"
                  type="number"
                  value={co2Amount}
                  onChange={(e) => setCo2Amount(e.target.value)}
                  placeholder="10"
                />
                <Button
                  onClick={() => handleUpdateStats('co2')}
                  disabled={isUpdating}
                  className="gradient-primary"
                >
                  <Leaf className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            {/* Rides Input */}
            <div>
              <Label htmlFor="rides">Total Rides</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="rides"
                  type="number"
                  value={ridesAmount}
                  onChange={(e) => setRidesAmount(e.target.value)}
                  placeholder="1"
                />
                <Button
                  onClick={() => handleUpdateStats('rides')}
                  disabled={isUpdating}
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            {/* Green Score Input */}
            <div>
              <Label htmlFor="score">Green Score</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="score"
                  type="number"
                  value={scoreAmount}
                  onChange={(e) => setScoreAmount(e.target.value)}
                  placeholder="50"
                />
                <Button
                  onClick={() => handleUpdateStats('score')}
                  disabled={isUpdating}
                  variant="outline"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            {/* Add All Button */}
            <Button
              onClick={() => handleUpdateStats('all')}
              disabled={isUpdating}
              className="w-full gradient-primary"
              size="lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isUpdating ? 'Updating...' : 'Add All Stats'}
            </Button>
          </div>
        </Card>

        {/* Warning */}
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
          <p className="text-sm text-yellow-600 dark:text-yellow-500">
            ⚠️ <strong>Dev Tool:</strong> This page is for testing purposes. Use it to
            populate your profile with data to see how the dashboard looks.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default DevTools;
