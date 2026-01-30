import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Award,
  Car,
  UserCheck,
  Users,
  Leaf,
  TrendingUp,
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/');
    return null;
  }

  const getRoleIcon = () => {
    switch (user.role) {
      case 'driver':
        return <Car className="w-5 h-5 text-primary" />;
      case 'passenger':
        return <UserCheck className="w-5 h-5 text-primary" />;
      case 'both':
        return <Users className="w-5 h-5 text-primary" />;
    }
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case 'driver':
        return 'Driver';
      case 'passenger':
        return 'Passenger';
      case 'both':
        return 'Driver & Passenger';
    }
  };

  const greenLevel = user.greenScore < 100 ? 'Eco Starter' : 
                     user.greenScore < 500 ? 'Green Commuter' : 
                     user.greenScore < 1000 ? 'Sustainability Champion' : 'Eco Warrior';

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
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-6 py-6 space-y-4">
        {/* Profile Card */}
        <Card className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-4xl font-bold text-primary">
                {user.name.charAt(0)}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-card-foreground">{user.name}</h2>
            <div className="flex items-center space-x-2 mt-2">
              {getRoleIcon()}
              <span className="text-muted-foreground">{getRoleLabel()}</span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 border-t border-border pt-6">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-card-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-card-foreground">{user.phone}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Green Score */}
        <Card className="p-6 gradient-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-card-foreground">Green Score</p>
                <p className="text-sm text-muted-foreground">{greenLevel}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{user.greenScore}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="gradient-primary h-2 rounded-full transition-all"
              style={{ width: `${Math.min((user.greenScore / 1000) * 100, 100)}%` }}
            />
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <Leaf className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-card-foreground">{user.co2Saved}</p>
            <p className="text-xs text-muted-foreground">kg CO₂</p>
          </Card>

          <Card className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-card-foreground">{user.totalRides}</p>
            <p className="text-xs text-muted-foreground">Rides</p>
          </Card>

          <Card className="p-4 text-center">
            <Award className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-card-foreground">{user.rating}</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </Card>
        </div>

        {/* Member Since */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Member since</p>
              <p className="font-semibold text-card-foreground">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
