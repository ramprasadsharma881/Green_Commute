import { Leaf, Coins, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

interface CarbonCreditWidgetProps {
  balance?: number;
  level?: {
    level: number;
    name: string;
    next: number | null;
  };
  totalEarned?: number;
  compact?: boolean;
}

export function CarbonCreditWidget({
  balance = 0,
  level = { level: 1, name: 'Beginner', next: 100 },
  totalEarned = 0,
  compact = false,
}: CarbonCreditWidgetProps) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div
        onClick={() => navigate('/carbon')}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg cursor-pointer hover:shadow-md transition-all border border-green-200 dark:border-green-800"
      >
        <Coins className="w-5 h-5 text-green-600" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-green-600">{balance}</span>
          <span className="text-xs text-muted-foreground">Credits</span>
        </div>
      </div>
    );
  }

  const levelProgress = level.next ? (totalEarned / level.next) * 100 : 100;

  return (
    <Card
      onClick={() => navigate('/carbon')}
      className="p-4 cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-green-600" />
          <div>
            <p className="text-sm text-muted-foreground">Carbon Credits</p>
            <p className="text-2xl font-bold text-green-600">{balance}</p>
          </div>
        </div>
        <Badge className="bg-blue-600 text-white">
          Level {level.level}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{level.name}</span>
          <span className="font-medium">
            {totalEarned} / {level.next || '∞'}
          </span>
        </div>
        <Progress value={levelProgress} className="h-2" />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="w-3 h-3" />
          <span>Click to view rewards & achievements</span>
        </div>
      </div>
    </Card>
  );
}
