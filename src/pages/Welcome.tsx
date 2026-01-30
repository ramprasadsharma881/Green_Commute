import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Leaf, Users, TrendingDown, Shield } from 'lucide-react';

const Welcome = () => {
  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 animate-bounce-subtle">
              <Leaf className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Green<span className="text-primary">Commute</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Share rides, save the planet
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 py-8">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Eco-Friendly Carpooling</h3>
                <p className="text-sm text-muted-foreground">Connect with fellow commuters going your way</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Reduce Carbon Footprint</h3>
                <p className="text-sm text-muted-foreground">Track your environmental impact in real-time</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Safe & Verified</h3>
                <p className="text-sm text-muted-foreground">All users are verified for your safety</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link to="/signup" className="block">
              <Button className="w-full h-12 text-base gradient-primary hover:opacity-90 transition-opacity">
                Get Started
              </Button>
            </Link>
            <Link to="/login" className="block">
              <Button variant="outline" className="w-full h-12 text-base border-primary text-primary hover:bg-primary/5">
                Sign In
              </Button>
            </Link>
          </div>

          <p className="text-center text-xs text-muted-foreground pt-4">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
