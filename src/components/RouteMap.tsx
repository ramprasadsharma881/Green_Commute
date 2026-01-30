import { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsScript, calculateRealDistance, checkAPIKeyStatus, resetToFirstKey } from '@/lib/googleMaps';
import { Loader2, RefreshCw, Key } from 'lucide-react';

interface RouteMapProps {
  origin: string;
  destination: string;
  className?: string;
}

const RouteMap = ({ origin, destination, className = '' }: RouteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [routeInfo, setRouteInfo] = useState<{distance: string; duration: string} | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState(checkAPIKeyStatus());
  const [isRetrying, setIsRetrying] = useState(false);

  // Retry function with key reset
  const handleRetry = () => {
    setIsRetrying(true);
    setError(null);
    resetToFirstKey();
    setApiKeyStatus(checkAPIKeyStatus());
    // Trigger re-initialization
    setTimeout(() => {
      setIsRetrying(false);
    }, 1000);
  };

  useEffect(() => {
    const initMap = async () => {
      const timeoutId = setTimeout(() => {
        console.error('⏱️ Map initialization timed out after trying all fallbacks');
        setError('Map loading timed out. All API keys may have been tried or network issues present.');
        setIsLoading(false);
      }, 20000); // 20 second timeout to allow for auto-fallback attempts

      try {
        setIsLoading(true);
        setError(null);

        // Load Google Maps script (with automatic fallback)
        console.log('🚀 RouteMap: Starting Google Maps script loading...');
        await loadGoogleMapsScript();
        console.log('✅ RouteMap: Google Maps script loaded successfully');
        
        // Clear timeout immediately after successful script load
        clearTimeout(timeoutId);
        console.log('🕒 RouteMap: Timeout cleared after successful script load');
        
        // Update API key status after successful load
        setApiKeyStatus(checkAPIKeyStatus());
        
        // Check if API key is valid
        if (!window.google || !window.google.maps) {
          throw new Error('Google Maps failed to load. Please check your API key.');
        }

        let attempts = 0;
        while (!mapRef.current && attempts < 20) {
          await new Promise((r) => setTimeout(r, 50));
          attempts++;
        }
        if (!mapRef.current) {
          setError('Map container not ready. Please try again.');
          setIsLoading(false);
          return;
        }

        // Create map instance
        const mapInstance = new google.maps.Map(mapRef.current, {
          zoom: 12,
          center: { lat: 0, lng: 0 },
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        setMap(mapInstance);
        // Map is visible now; hide loading overlay while we compute directions
        setIsLoading(false);

        // Validate locations are not empty
        if (!origin?.trim() || !destination?.trim()) {
          setError('Invalid pickup or destination location');
          return;
        }

        // Get directions and display route
        console.log('🗺️ RouteMap: Calculating route from', origin, 'to', destination);
        const result = await calculateRealDistance(origin, destination);
        console.log('📍 RouteMap: Route calculation result:', result ? 'Success' : 'Failed');

        if (result && result.route) {
          // Store route info
          setRouteInfo({
            distance: result.distanceText,
            duration: result.durationText,
          });
          const route = result.route;

          // Create DirectionsRenderer
          const directionsRenderer = new google.maps.DirectionsRenderer({
            map: mapInstance,
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: '#10b981', // Green color
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
          });

          // Display the route using the full DirectionsResult
          if (result.directionsResult) {
            directionsRenderer.setDirections(result.directionsResult);
          }

          // Add custom markers for start and end
          const startMarker = new google.maps.Marker({
            position: route.legs[0].start_location,
            map: mapInstance,
            title: 'Pickup Location',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#10b981',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            label: {
              text: 'A',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
            },
          });

          const endMarker = new google.maps.Marker({
            position: route.legs[0].end_location,
            map: mapInstance,
            title: 'Destination',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            label: {
              text: 'B',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
            },
          });

          // Add info windows
          const startInfoWindow = new google.maps.InfoWindow({
            content: `<div style="padding: 8px;"><strong>Pickup</strong><br/>${origin}</div>`,
          });

          const endInfoWindow = new google.maps.InfoWindow({
            content: `<div style="padding: 8px;"><strong>Destination</strong><br/>${destination}</div>`,
          });

          startMarker.addListener('click', () => {
            startInfoWindow.open(mapInstance, startMarker);
          });

          endMarker.addListener('click', () => {
            endInfoWindow.open(mapInstance, endMarker);
          });

          // Fit map to bounds
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(route.legs[0].start_location);
          bounds.extend(route.legs[0].end_location);
          mapInstance.fitBounds(bounds);

          // Add padding to bounds
          setTimeout(() => {
            mapInstance.panBy(0, -50);
          }, 100);
        } else {
          // Better error message based on location validity
          const errorMsg = origin.length < 5 || destination.length < 5
            ? `Invalid location: "${origin.length < 5 ? origin : destination}". Please use full addresses.`
            : `No route found between "${origin}" and "${destination}". Please verify the locations are valid.`;
          setError(errorMsg);
        }

        setIsLoading(false);
        console.log('🎉 RouteMap: Map initialization completed successfully');
      } catch (err: any) {
        console.error('Error loading map:', err);
        clearTimeout(timeoutId); // Clear timeout on error
        const currentStatus = checkAPIKeyStatus();
        setApiKeyStatus(currentStatus);
        
        let errorMessage = err.message || 'Failed to load map.';
        if (err.message && err.message.includes('All Google Maps API keys failed')) {
          errorMessage = `All ${currentStatus.totalKeys} API keys exhausted. Please check billing status.`;
        }
        
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    // Only initialize if not currently retrying
    if (!isRetrying) {
      initMap();
    }
  }, [origin, destination, isRetrying]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-xl" />

      {/* Loading overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-xl">
          <div className="text-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
            <div className="mt-3 text-xs text-muted-foreground/80">
              <div className="flex items-center justify-center gap-1">
                <Key className="w-3 h-3" />
                <span>Using key {apiKeyStatus.currentKeyIndex + 1}/{apiKeyStatus.totalKeys}</span>
              </div>
              {apiKeyStatus.hasMoreKeys && (
                <p className="text-blue-600 dark:text-blue-400 mt-1">Auto-fallback ready</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 rounded-xl border-2 border-destructive/20 p-6">
          <div className="text-center">
            <div className="mb-3">
              <svg className="w-12 h-12 mx-auto text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-destructive mb-2">Map Preview Unavailable</p>
            <p className="text-xs text-muted-foreground mb-4">{error}</p>

            {/* API Key Status */}
            <div className="bg-muted rounded-lg p-3 mb-4 text-xs">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Key className="w-3 h-3" />
                <span className="font-medium">API Key Status</span>
              </div>
              <p className="text-muted-foreground">
                Using key {apiKeyStatus.currentKeyIndex + 1}/{apiKeyStatus.totalKeys} ({apiKeyStatus.currentKey})
              </p>
              {apiKeyStatus.hasMoreKeys && (
                <p className="text-green-600 text-xs mt-1">Fallback keys available</p>
              )}
            </div>

            {/* Retry Button */}
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-xs"
            >
              {isRetrying ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              {isRetrying ? 'Retrying...' : 'Retry with Key 1'}
            </button>
          </div>
        </div>
      )}

      {/* API Key Status Indicator */}
      <div className="absolute top-4 right-4">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs flex items-center gap-1 shadow-sm">
          <Key className="w-3 h-3 text-green-600" />
          <span className="text-muted-foreground">Key {apiKeyStatus.currentKeyIndex + 1}/{apiKeyStatus.totalKeys}</span>
        </div>
      </div>

      {routeInfo && (
        <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-sm font-medium">{routeInfo.distance}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{routeInfo.duration}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteMap;
