import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Calendar,
  Plus,
  Repeat,
  Clock,
  Users,
  IndianRupee,
  MapPin,
  Play,
  Pause,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecurringRide {
  id: string;
  source: string;
  destination: string;
  recurrencePattern: 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom';
  daysOfWeek?: string[];
  time: string;
  availableSeats: number;
  pricePerSeat: number;
  isActive: boolean;
  nextRideDate?: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function RecurringRides() {
  const { toast } = useToast();
  const [recurringRides, setRecurringRides] = useState<RecurringRide[]>([
    {
      id: '1',
      source: 'Home, Andheri',
      destination: 'Office, BKC',
      recurrencePattern: 'weekdays',
      time: '08:30',
      availableSeats: 3,
      pricePerSeat: 150,
      isActive: true,
      nextRideDate: '2025-11-06',
    },
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRide, setNewRide] = useState({
    source: '',
    destination: '',
    recurrencePattern: 'weekdays' as RecurringRide['recurrencePattern'],
    daysOfWeek: [] as string[],
    time: '',
    availableSeats: 3,
    pricePerSeat: 100,
  });

  const handleSaveRecurringRide = () => {
    if (!newRide.source || !newRide.destination || !newRide.time) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const ride: RecurringRide = {
      id: Date.now().toString(),
      ...newRide,
      isActive: true,
      nextRideDate: new Date().toISOString().split('T')[0],
    };

    setRecurringRides((prev) => [ride, ...prev]);
    setNewRide({
      source: '',
      destination: '',
      recurrencePattern: 'weekdays',
      daysOfWeek: [],
      time: '',
      availableSeats: 3,
      pricePerSeat: 100,
    });
    setIsDialogOpen(false);

    toast({
      title: '🔄 Recurring Ride Created!',
      description: 'Your ride will be auto-created based on the schedule',
    });
  };

  const toggleRideStatus = (rideId: string) => {
    setRecurringRides((prev) =>
      prev.map((r) =>
        r.id === rideId ? { ...r, isActive: !r.isActive } : r
      )
    );

    const ride = recurringRides.find((r) => r.id === rideId);
    toast({
      title: ride?.isActive ? 'Ride Paused' : 'Ride Activated',
      description: ride?.isActive
        ? 'No new rides will be created'
        : 'Rides will be auto-created again',
    });
  };

  const deleteRide = (rideId: string) => {
    setRecurringRides((prev) => prev.filter((r) => r.id !== rideId));
    toast({
      title: 'Recurring Ride Deleted',
      description: 'The schedule has been removed',
    });
  };

  const getPatternLabel = (pattern: string) => {
    switch (pattern) {
      case 'daily':
        return 'Every Day';
      case 'weekdays':
        return 'Mon - Fri';
      case 'weekends':
        return 'Sat - Sun';
      case 'weekly':
        return 'Weekly';
      case 'custom':
        return 'Custom Days';
      default:
        return pattern;
    }
  };

  const handleDayToggle = (day: string) => {
    setNewRide((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Repeat className="w-10 h-10 text-purple-600" />
            Recurring Rides
          </h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-5 h-5 mr-2" />
                Schedule Recurring Ride
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule Recurring Ride</DialogTitle>
                <DialogDescription>
                  Set up automatic ride creation for your regular commutes
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Route Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Route Details</h3>
                  <div>
                    <Label htmlFor="source">Starting Point</Label>
                    <Input
                      id="source"
                      placeholder="Enter start location"
                      value={newRide.source}
                      onChange={(e) =>
                        setNewRide({ ...newRide, source: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      placeholder="Enter destination"
                      value={newRide.destination}
                      onChange={(e) =>
                        setNewRide({ ...newRide, destination: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Recurrence Pattern */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Recurrence Pattern</h3>
                  <RadioGroup
                    value={newRide.recurrencePattern}
                    onValueChange={(value: any) =>
                      setNewRide({ ...newRide, recurrencePattern: value })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily">Every Day</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekdays" id="weekdays" />
                      <Label htmlFor="weekdays">Weekdays (Mon-Fri)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekends" id="weekends" />
                      <Label htmlFor="weekends">Weekends (Sat-Sun)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom">Custom Days</Label>
                    </div>
                  </RadioGroup>

                  {newRide.recurrencePattern === 'custom' && (
                    <div className="pl-6 space-y-2">
                      <Label>Select Days</Label>
                      <div className="flex gap-2">
                        {DAYS.map((day) => (
                          <div key={day} className="flex items-center">
                            <Checkbox
                              id={day}
                              checked={newRide.daysOfWeek.includes(day)}
                              onCheckedChange={() => handleDayToggle(day)}
                            />
                            <Label htmlFor={day} className="ml-2 cursor-pointer">
                              {day}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Time and Ride Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="time">Departure Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newRide.time}
                      onChange={(e) =>
                        setNewRide({ ...newRide, time: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="seats">Available Seats</Label>
                    <Input
                      id="seats"
                      type="number"
                      min="1"
                      max="6"
                      value={newRide.availableSeats}
                      onChange={(e) =>
                        setNewRide({
                          ...newRide,
                          availableSeats: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price Per Seat (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={newRide.pricePerSeat}
                      onChange={(e) =>
                        setNewRide({
                          ...newRide,
                          pricePerSeat: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    💡 <strong>Auto-Matching:</strong> Passengers who regularly
                    travel this route will be matched automatically!
                  </p>
                </div>

                <Button onClick={handleSaveRecurringRide} className="w-full">
                  Create Recurring Ride
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground">
          Automate your regular commutes with recurring rides
        </p>
      </div>

      {/* Active Recurring Rides */}
      <div className="space-y-4">
        {recurringRides.length === 0 ? (
          <Card className="p-12 text-center">
            <Repeat className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-semibold mb-2">
              No recurring rides scheduled
            </h3>
            <p className="text-muted-foreground mb-4">
              Set up automatic ride creation for your regular commutes
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Schedule Your First Ride
            </Button>
          </Card>
        ) : (
          recurringRides.map((ride) => (
            <Card
              key={ride.id}
              className={`p-6 ${
                !ride.isActive ? 'opacity-60' : ''
              } hover:shadow-lg transition-all`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge
                      variant={ride.isActive ? 'default' : 'secondary'}
                    >
                      <Repeat className="w-3 h-3 mr-1" />
                      {getPatternLabel(ride.recurrencePattern)}
                    </Badge>
                    {ride.isActive && (
                      <Badge variant="outline" className="bg-green-50">
                        Active
                      </Badge>
                    )}
                    {!ride.isActive && (
                      <Badge variant="outline">Paused</Badge>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">From</p>
                          <p className="font-medium">{ride.source}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">To</p>
                          <p className="font-medium">{ride.destination}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Time</p>
                          <p className="font-medium">{ride.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Seats</p>
                          <p className="font-medium">{ride.availableSeats}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-medium">₹{ride.pricePerSeat}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {ride.nextRideDate && ride.isActive && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-sm">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        <strong>Next ride:</strong>{' '}
                        {new Date(ride.nextRideDate).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant={ride.isActive ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => toggleRideStatus(ride.id)}
                  >
                    {ride.isActive ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRide(ride.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
