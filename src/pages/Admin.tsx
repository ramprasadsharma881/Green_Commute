import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Users,
  Car,
  TrendingUp,
  AlertCircle,
  Search,
  Ban,
  CheckCircle,
  XCircle,
  Leaf,
  IndianRupee,
  Calendar,
  MapPin,
} from 'lucide-react';
import { storage, User as UserType, Ride } from '@/lib/storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRides: 0,
    totalCO2Saved: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    // Simple admin check - in production, this would be a proper role check
    if (!user) {
      navigate('/');
      return;
    }

    loadAdminData();
  }, [user, navigate]);

  const loadAdminData = () => {
    // Load users
    const allUsers = storage.get<{ [key: string]: UserType }>('users:all') || {};
    const usersArray = Object.values(allUsers);
    setUsers(usersArray);

    // Load rides
    const allRides = storage.get<Ride[]>('rides:all') || [];
    setRides(allRides);

    // Calculate stats
    const totalCO2 = usersArray.reduce((sum, u) => sum + u.co2Saved, 0);
    const totalRevenue = allRides.reduce((sum, r) => sum + r.pricePerSeat * (4 - r.availableSeats), 0);

    setStats({
      totalUsers: usersArray.length,
      totalRides: allRides.length,
      totalCO2Saved: totalCO2,
      totalRevenue: totalRevenue,
    });
  };

  const handleBanUser = (userId: string) => {
    // In a real app, this would update user status
    console.log('Banning user:', userId);
    loadAdminData();
  };

  const handleDeleteRide = (rideId: string) => {
    const allRides = storage.get<Ride[]>('rides:all') || [];
    const updatedRides = allRides.filter((r) => r.id !== rideId);
    storage.set('rides:all', updatedRides);
    loadAdminData();
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRides = rides.filter((r) =>
    r.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.driverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary text-white p-6 pb-24">
        <div className="container max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/10 mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center space-x-3 mb-6">
            <AlertCircle className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <p className="text-white/80 text-sm">Manage users, rides, and platform statistics</p>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-6 -mt-16">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 shadow-eco">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
              </div>
              <Users className="w-10 h-10 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6 shadow-eco">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Rides</p>
                <p className="text-3xl font-bold text-primary">{stats.totalRides}</p>
              </div>
              <Car className="w-10 h-10 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6 shadow-eco">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">CO₂ Saved</p>
                <p className="text-3xl font-bold text-primary">{stats.totalCO2Saved.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">kg</p>
              </div>
              <Leaf className="w-10 h-10 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6 shadow-eco">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Revenue</p>
                <p className="text-3xl font-bold text-primary">₹{stats.totalRevenue}</p>
              </div>
              <IndianRupee className="w-10 h-10 text-primary opacity-20" />
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users or rides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="rides">
              <Car className="w-4 h-4 mr-2" />
              Rides
            </TabsTrigger>
            <TabsTrigger value="reports">
              <AlertCircle className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-3">
            {filteredUsers.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </Card>
            ) : (
              filteredUsers.map((u) => (
                <Card key={u.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {u.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-card-foreground">{u.name}</h3>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <div className="flex items-center space-x-3 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {u.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {u.totalRides} rides
                          </span>
                          <span className="text-xs text-primary">
                            {u.greenScore} points
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Verify
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Ban className="w-4 h-4 mr-1" />
                            Ban
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ban this user?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will prevent the user from accessing the platform.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleBanUser(u.id)}>
                              Ban User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Rides Tab */}
          <TabsContent value="rides" className="space-y-3">
            {filteredRides.length === 0 ? (
              <Card className="p-12 text-center">
                <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No rides found</p>
              </Card>
            ) : (
              filteredRides.map((ride) => (
                <Card key={ride.id} className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-card-foreground">
                          {ride.driverName}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {new Date(ride.dateTime) > new Date() ? 'Upcoming' : 'Completed'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{ride.source} → {ride.destination}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(ride.dateTime).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">₹{ride.pricePerSeat}</p>
                        <p className="text-xs text-muted-foreground">{ride.availableSeats} seats</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this ride?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRide(ride.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground border-t pt-3">
                    <span className="flex items-center space-x-1">
                      <Car className="w-3 h-3" />
                      <span>{ride.vehicleModel}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Leaf className="w-3 h-3 text-primary" />
                      <span>{ride.co2Saved} kg CO₂</span>
                    </span>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                No Reports
              </h3>
              <p className="text-muted-foreground text-sm">
                All reports and flagged content will appear here
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
