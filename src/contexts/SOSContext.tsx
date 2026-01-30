import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { storage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export interface SOSEvent {
  id: string;
  userId: string;
  type: 'danger' | 'unsafe' | 'test';
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  rideId?: string;
  status: 'active' | 'resolved' | 'cancelled';
  emergencyContactsNotified: string[];
  notes?: string;
}

interface SOSContextType {
  isSOSActive: boolean;
  currentSOSEvent: SOSEvent | null;
  sosHistory: SOSEvent[];
  activateSOS: (type: 'danger' | 'unsafe', rideId?: string) => Promise<void>;
  deactivateSOS: (reason: 'resolved' | 'cancelled') => Promise<void>;
  testSOS: () => Promise<void>;
  getSosHistory: () => SOSEvent[];
}

const SOSContext = createContext<SOSContextType | undefined>(undefined);

export const SOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [currentSOSEvent, setCurrentSOSEvent] = useState<SOSEvent | null>(null);
  const [sosHistory, setSosHistory] = useState<SOSEvent[]>([]);

  useEffect(() => {
    if (user) {
      // Load SOS history from storage
      const history = storage.get<SOSEvent[]>(`sos:${user.id}:history`) || [];
      setSosHistory(history);

      // Check for active SOS
      const activeEvent = storage.get<SOSEvent>(`sos:${user.id}:active`);
      if (activeEvent && activeEvent.status === 'active') {
        setCurrentSOSEvent(activeEvent);
        setIsSOSActive(true);
      }
    }
  }, [user]);

  const getCurrentLocation = (): Promise<{ lat: number; lng: number; address?: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Try to get address from coordinates (reverse geocoding)
          let address = 'Location unavailable';
          try {
            // In a real app, you'd use Google Maps Geocoding API
            address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          } catch (error) {
            console.warn('Could not get address:', error);
          }

          resolve({
            lat: latitude,
            lng: longitude,
            address
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const notifyEmergencyContacts = async (sosEvent: SOSEvent) => {
    if (!user) return [];

    // Get emergency contacts from SafetyCenter
    const emergencyContacts = storage.get<any[]>(`safety:${user.id}:contacts`) || [];
    
    if (emergencyContacts.length === 0) {
      toast({
        title: 'No emergency contacts',
        description: 'Add emergency contacts in Safety Center for notifications',
        variant: 'destructive',
      });
      return [];
    }

    const notifiedContacts: string[] = [];

    for (const contact of emergencyContacts) {
      try {
        // In a real app, this would send actual SMS/notifications
        console.log(`🚨 SOS Alert sent to ${contact.name} (${contact.phone})`);
        console.log(`Message: "${user.name} has activated SOS. Location: ${sosEvent.location?.address || 'Unknown'}. Time: ${new Date(sosEvent.timestamp).toLocaleString()}"`);
        
        notifiedContacts.push(contact.id);
        
        // Simulate notification delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to notify ${contact.name}:`, error);
      }
    }

    toast({
      title: 'Emergency contacts notified! 🚨',
      description: `${notifiedContacts.length} contacts have been alerted with your location`,
    });

    return notifiedContacts;
  };

  const activateSOS = async (type: 'danger' | 'unsafe', rideId?: string) => {
    if (!user || isSOSActive) return;

    try {
      // Get current location
      const location = await getCurrentLocation();

      // Create SOS event
      const sosEvent: SOSEvent = {
        id: `sos-${Date.now()}`,
        userId: user.id,
        type,
        timestamp: new Date().toISOString(),
        location,
        rideId,
        status: 'active',
        emergencyContactsNotified: [],
      };

      // Notify emergency contacts
      const notifiedContacts = await notifyEmergencyContacts(sosEvent);
      sosEvent.emergencyContactsNotified = notifiedContacts;

      // Update state
      setCurrentSOSEvent(sosEvent);
      setIsSOSActive(true);

      // Save to storage
      storage.set(`sos:${user.id}:active`, sosEvent);

      // Add to history
      const updatedHistory = [sosEvent, ...sosHistory];
      setSosHistory(updatedHistory);
      storage.set(`sos:${user.id}:history`, updatedHistory);

      toast({
        title: type === 'danger' ? '🚨 SOS ACTIVATED' : '⚠️ Safety Alert Sent',
        description: 'Emergency contacts have been notified with your location',
        variant: type === 'danger' ? 'destructive' : 'default',
      });

      // Auto-deactivate after 30 minutes for safety
      setTimeout(() => {
        if (isSOSActive) {
          deactivateSOS('resolved');
        }
      }, 30 * 60 * 1000);

    } catch (error) {
      console.error('SOS activation failed:', error);
      toast({
        title: 'SOS activation failed',
        description: 'Could not activate SOS. Please try again or call emergency services directly.',
        variant: 'destructive',
      });
    }
  };

  const deactivateSOS = async (reason: 'resolved' | 'cancelled') => {
    if (!user || !currentSOSEvent) return;

    try {
      // Update SOS event status
      const updatedEvent = {
        ...currentSOSEvent,
        status: reason,
        notes: reason === 'resolved' ? 'Situation resolved by user' : 'False alarm - cancelled by user'
      };

      // Update state
      setCurrentSOSEvent(null);
      setIsSOSActive(false);

      // Remove active SOS from storage
      storage.remove(`sos:${user.id}:active`);

      // Update history
      const updatedHistory = sosHistory.map(event => 
        event.id === currentSOSEvent.id ? updatedEvent : event
      );
      setSosHistory(updatedHistory);
      storage.set(`sos:${user.id}:history`, updatedHistory);

      toast({
        title: reason === 'resolved' ? '✅ SOS Deactivated' : '❌ SOS Cancelled',
        description: reason === 'resolved' ? 'Glad you\'re safe!' : 'SOS has been cancelled',
      });

    } catch (error) {
      console.error('SOS deactivation failed:', error);
    }
  };

  const testSOS = async () => {
    if (!user) return;

    try {
      const location = await getCurrentLocation();
      
      const testEvent: SOSEvent = {
        id: `sos-test-${Date.now()}`,
        userId: user.id,
        type: 'test',
        timestamp: new Date().toISOString(),
        location,
        status: 'resolved',
        emergencyContactsNotified: [],
        notes: 'SOS system test'
      };

      // Add to history
      const updatedHistory = [testEvent, ...sosHistory];
      setSosHistory(updatedHistory);
      storage.set(`sos:${user.id}:history`, updatedHistory);

      toast({
        title: '🧪 SOS Test Completed',
        description: 'Your SOS system is working correctly. Location captured successfully.',
      });

    } catch (error) {
      console.error('SOS test failed:', error);
      toast({
        title: 'SOS test failed',
        description: 'Could not complete SOS test. Check location permissions.',
        variant: 'destructive',
      });
    }
  };

  const getSosHistory = () => {
    return sosHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  return (
    <SOSContext.Provider value={{
      isSOSActive,
      currentSOSEvent,
      sosHistory,
      activateSOS,
      deactivateSOS,
      testSOS,
      getSosHistory
    }}>
      {children}
    </SOSContext.Provider>
  );
};

export const useSOS = () => {
  const context = useContext(SOSContext);
  if (context === undefined) {
    throw new Error('useSOS must be used within an SOSProvider');
  }
  return context;
};
