import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MapPin,
  Plus,
  Star,
  Trash2,
  Edit,
  Navigation,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface FavoriteRoute {
  id: string;
  name: string;
  source: string;
  destination: string;
  waypoints?: string[];
  useCount: number;
  createdAt: string;
}

export default function FavoriteRoutes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [routes, setRoutes] = useState<FavoriteRoute[]>([
    {
      id: '1',
      name: 'Home to Work',
      source: '123 Main St, Mumbai',
      destination: '456 Office Blvd, Mumbai',
      useCount: 45,
      createdAt: '2025-09-01',
    },
    {
      id: '2',
      name: 'Gym Commute',
      source: 'Home',
      destination: 'FitZone Gym, Andheri',
      useCount: 18,
      createdAt: '2025-10-15',
    },
  ]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRoute, setNewRoute] = useState({
    name: '',
    source: '',
    destination: '',
  });

  const handleSaveRoute = () => {
    if (!newRoute.name || !newRoute.source || !newRoute.destination) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const route: FavoriteRoute = {
      id: Date.now().toString(),
      ...newRoute,
      useCount: 0,
      createdAt: new Date().toISOString(),
    };

    setRoutes((prev) => [route, ...prev]);
    setNewRoute({ name: '', source: '', destination: '' });
    setIsAddDialogOpen(false);

    toast({
      title: '✅ Route Saved!',
      description: 'Your favorite route has been added',
    });
  };

  const handleDeleteRoute = (routeId: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== routeId));
    toast({
      title: 'Route Deleted',
      description: 'The route has been removed',
    });
  };

  const handleUseRoute = (route: FavoriteRoute) => {
    // Navigate to offer ride with pre-filled data
    navigate('/offer-ride', {
      state: {
        source: route.source,
        destination: route.destination,
        routeName: route.name,
      },
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Star className="w-10 h-10 text-yellow-600" />
            Favorite Routes
          </h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-5 h-5 mr-2" />
                Add Route
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Favorite Route</DialogTitle>
                <DialogDescription>
                  Save your frequently used routes for quick access
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Route Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Home to Work"
                    value={newRoute.name}
                    onChange={(e) =>
                      setNewRoute({ ...newRoute, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="source">Starting Point</Label>
                  <Input
                    id="source"
                    placeholder="Enter start location"
                    value={newRoute.source}
                    onChange={(e) =>
                      setNewRoute({ ...newRoute, source: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="Enter destination"
                    value={newRoute.destination}
                    onChange={(e) =>
                      setNewRoute({
                        ...newRoute,
                        destination: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <Button onClick={handleSaveRoute} className="w-full">
                Save Route
              </Button>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground">
          Quickly create rides using your saved routes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{routes.length}</p>
              <p className="text-sm text-muted-foreground">Saved Routes</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {routes.reduce((sum, r) => sum + r.useCount, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Uses</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {routes.length > 0
                  ? Math.round(
                      routes.reduce((sum, r) => sum + r.useCount, 0) /
                        routes.length
                    )
                  : 0}
              </p>
              <p className="text-sm text-muted-foreground">Avg Uses</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Routes List */}
      <div className="space-y-4">
        {routes.length === 0 ? (
          <Card className="p-12 text-center">
            <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-semibold mb-2">No saved routes yet</h3>
            <p className="text-muted-foreground mb-4">
              Save your frequently used routes for quick access
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Route
            </Button>
          </Card>
        ) : (
          routes.map((route) => (
            <Card key={route.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold">{route.name}</h3>
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      {route.useCount} uses
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-1">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">From</p>
                        <p className="font-medium">{route.source}</p>
                      </div>
                    </div>

                    <div className="ml-1.5 border-l-2 border-dashed h-4" />

                    <div className="flex items-start gap-2">
                      <div className="mt-1">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">To</p>
                        <p className="font-medium">{route.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleUseRoute(route)}
                    className="whitespace-nowrap"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Use Route
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteRoute(route.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
