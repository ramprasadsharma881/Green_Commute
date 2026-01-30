import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Phone, Shield, X } from 'lucide-react';
import { useSOS } from '@/contexts/SOSContext';
import { cn } from '@/lib/utils';

interface SOSButtonProps {
  variant?: 'floating' | 'inline' | 'compact';
  rideId?: string;
  className?: string;
}

const SOSButton: React.FC<SOSButtonProps> = ({ 
  variant = 'floating', 
  rideId,
  className 
}) => {
  const { isSOSActive, activateSOS, deactivateSOS } = useSOS();
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const HOLD_DURATION = 3000; // 3 seconds
  const PROGRESS_INTERVAL = 50; // Update every 50ms

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const startHold = () => {
    if (isSOSActive) return;
    
    setIsHolding(true);
    setHoldProgress(0);

    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    // Progress animation
    progressTimerRef.current = setInterval(() => {
      setHoldProgress(prev => {
        const newProgress = prev + (PROGRESS_INTERVAL / HOLD_DURATION) * 100;
        return Math.min(newProgress, 100);
      });
    }, PROGRESS_INTERVAL);

    // Hold completion
    holdTimerRef.current = setTimeout(() => {
      setIsHolding(false);
      setHoldProgress(0);
      setShowConfirmation(true);
      
      // Strong vibration for activation
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }, HOLD_DURATION);
  };

  const cancelHold = () => {
    setIsHolding(false);
    setHoldProgress(0);
    
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const handleSOSActivation = async (type: 'danger' | 'unsafe') => {
    setShowConfirmation(false);
    await activateSOS(type, rideId);
  };

  const handleSOSDeactivation = async () => {
    await deactivateSOS('resolved');
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  // Floating variant (main SOS button)
  if (variant === 'floating') {
    return (
      <>
        <div className={cn(
          "fixed bottom-6 right-6 z-50",
          className
        )}>
          {isSOSActive ? (
            // Active SOS button
            <Button
              onClick={handleSOSDeactivation}
              className={cn(
                "w-20 h-20 rounded-full shadow-2xl border-4 border-white",
                "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
                "animate-pulse text-white font-bold text-sm",
                "flex flex-col items-center justify-center gap-1"
              )}
            >
              <Shield className="w-6 h-6" />
              <span>ACTIVE</span>
            </Button>
          ) : (
            // Hold-to-activate SOS button
            <div className="relative">
              <Button
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                className={cn(
                  "w-20 h-20 rounded-full shadow-2xl border-4 border-white",
                  "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
                  "text-white font-bold text-lg transition-all duration-200",
                  "flex flex-col items-center justify-center gap-1",
                  isHolding && "scale-110 shadow-red-500/50"
                )}
              >
                <AlertTriangle className="w-8 h-8" />
                <span className="text-xs">SOS</span>
              </Button>
              
              {/* Progress ring */}
              {isHolding && (
                <div className="absolute inset-0 rounded-full">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 46}`}
                      strokeDashoffset={`${2 * Math.PI * 46 * (1 - holdProgress / 100)}`}
                      className="transition-all duration-75 ease-linear"
                    />
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Emergency Situation?
                </h3>
                <p className="text-gray-600 text-sm">
                  Choose the type of emergency to alert your contacts
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <Button
                  onClick={() => handleSOSActivation('danger')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 text-base font-semibold"
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  I'm in Danger
                </Button>
                
                <Button
                  onClick={() => handleSOSActivation('unsafe')}
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 py-4 text-base font-semibold"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  I Feel Unsafe
                </Button>
              </div>

              <Button
                onClick={handleCancel}
                variant="ghost"
                className="w-full text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4 mr-2" />
                False Alarm
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Inline variant (for integration in other components)
  if (variant === 'inline') {
    return (
      <Button
        onClick={() => setShowConfirmation(true)}
        className={cn(
          "bg-red-600 hover:bg-red-700 text-white font-semibold",
          "flex items-center gap-2 px-6 py-3",
          className
        )}
        disabled={isSOSActive}
      >
        <AlertTriangle className="w-5 h-5" />
        {isSOSActive ? 'SOS Active' : 'Emergency SOS'}
      </Button>
    );
  }

  // Compact variant (for smaller spaces)
  if (variant === 'compact') {
    return (
      <Button
        onClick={() => setShowConfirmation(true)}
        size="sm"
        className={cn(
          "bg-red-600 hover:bg-red-700 text-white",
          "w-12 h-12 rounded-full p-0",
          className
        )}
        disabled={isSOSActive}
      >
        <AlertTriangle className="w-5 h-5" />
      </Button>
    );
  }

  return null;
};

export default SOSButton;
