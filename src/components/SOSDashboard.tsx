import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle,
  XCircle,
  TestTube,
  History
} from 'lucide-react';
import { useSOS } from '@/contexts/SOSContext';
import SOSButton from './SOSButton';

const SOSDashboard: React.FC = () => {
  const { isSOSActive, currentSOSEvent, getSosHistory, testSOS } = useSOS();
  const sosHistory = getSosHistory();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-500';
      case 'resolved':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'danger':
        return 'Emergency';
      case 'unsafe':
        return 'Safety Alert';
      case 'test':
        return 'System Test';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Current SOS Status */}
      {isSOSActive && currentSOSEvent && (
        <Card className="p-6 border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
                  SOS ACTIVE
                </h3>
                <p className="text-sm text-red-600 dark:text-red-500">
                  {getTypeLabel(currentSOSEvent.type)} • {formatDate(currentSOSEvent.timestamp)}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(currentSOSEvent.status)}>
              {currentSOSEvent.status.toUpperCase()}
            </Badge>
          </div>

          {currentSOSEvent.location && (
            <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-500 mb-3">
              <MapPin className="w-4 h-4" />
              <span>{currentSOSEvent.location.address}</span>
            </div>
          )}

          <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-500 mb-4">
            <Phone className="w-4 h-4" />
            <span>
              {currentSOSEvent.emergencyContactsNotified.length} contacts notified
            </span>
          </div>

          <div className="flex items-center justify-center">
            <SOSButton variant="inline" />
          </div>
        </Card>
      )}

      {/* SOS Controls */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-primary" />
          Emergency SOS
        </h3>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            In case of emergency, hold the SOS button for 3 seconds to alert your emergency contacts 
            with your location and ride details.
          </p>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-foreground">Emergency SOS</p>
              <p className="text-sm text-muted-foreground">
                {isSOSActive ? 'Currently active' : 'Ready to use'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={testSOS}
                variant="outline"
                size="sm"
                disabled={isSOSActive}
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test
              </Button>
              <SOSButton variant="compact" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                I'm in Danger
              </p>
              <p className="text-xs text-red-600 dark:text-red-500">
                Immediate emergency
              </p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <Shield className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                I Feel Unsafe
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-500">
                Precautionary alert
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* SOS History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <History className="w-5 h-5 mr-2 text-primary" />
          SOS History
        </h3>

        {sosHistory.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm">No SOS events recorded</p>
            <p className="text-muted-foreground text-xs mt-1">
              Your emergency activations will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sosHistory.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(event.status)}
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {getTypeLabel(event.type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.timestamp)}
                    </p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {event.location.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(event.status)} text-white border-0`}
                  >
                    {event.status}
                  </Badge>
                  {event.emergencyContactsNotified.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.emergencyContactsNotified.length} notified
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {sosHistory.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" className="text-xs">
                  View all {sosHistory.length} events
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Safety Tips */}
      <Card className="p-6 gradient-card">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-primary" />
          SOS Safety Tips
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Add emergency contacts in the Contacts tab for instant notifications</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Test your SOS system regularly to ensure it works when needed</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Keep location services enabled for accurate emergency location sharing</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Use "I Feel Unsafe" for precautionary alerts, "I'm in Danger" for emergencies</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SOSDashboard;
