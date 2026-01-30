import { Leaf } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface CarbonBadgeProps {
  co2Amount?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'info';
}

const CarbonBadge = ({ 
  co2Amount, 
  size = 'md', 
  showLabel = true,
  variant = 'success'
}: CarbonBadgeProps) => {
  const { user } = useAuth();
  const amount = co2Amount ?? user?.co2Saved ?? 0;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const variantClasses = {
    default: 'bg-muted text-foreground',
    success: 'bg-green-500 text-white hover:bg-green-600',
    info: 'bg-primary text-primary-foreground',
  };

  return (
    <Badge 
      className={`${sizeClasses[size]} ${variantClasses[variant]} flex items-center space-x-1.5 font-medium`}
    >
      <Leaf className={iconSizes[size]} />
      <span>{amount} kg CO₂</span>
      {showLabel && <span className="hidden sm:inline">saved</span>}
    </Badge>
  );
};

export default CarbonBadge;
