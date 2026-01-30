import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Car, UserCheck, Users, Leaf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const RoleSelection = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'driver' | 'passenger' | 'both' | null>(null);

  const handleContinue = () => {
    if (!selectedRole) {
      toast({
        title: 'Please select a role',
        description: 'Choose how you want to use GreenCommute',
        variant: 'destructive',
      });
      return;
    }

    updateUser({ role: selectedRole });
    toast({
      title: 'Profile completed! 🎉',
      description: 'You can now start using GreenCommute',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8 animate-scale-in">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Leaf className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Choose Your Role</h1>
          <p className="text-muted-foreground mt-2">
            How would you like to use GreenCommute?
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setSelectedRole('passenger')}
            className={`w-full p-6 rounded-2xl border-2 transition-all hover-lift ${
              selectedRole === 'passenger'
                ? 'border-primary bg-primary/5 shadow-eco'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-card-foreground text-lg">Passenger</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Find and book eco-friendly rides
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole('driver')}
            className={`w-full p-6 rounded-2xl border-2 transition-all hover-lift ${
              selectedRole === 'driver'
                ? 'border-primary bg-primary/5 shadow-eco'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-card-foreground text-lg">Driver</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Offer rides and earn while helping the planet
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole('both')}
            className={`w-full p-6 rounded-2xl border-2 transition-all hover-lift ${
              selectedRole === 'both'
                ? 'border-primary bg-primary/5 shadow-eco'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-card-foreground text-lg">Both</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Flexibility to drive or ride as needed
                </p>
              </div>
            </div>
          </button>
        </div>

        <Button
          onClick={handleContinue}
          className="w-full h-12 gradient-primary hover:opacity-90 transition-opacity"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default RoleSelection;
