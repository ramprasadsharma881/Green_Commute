// Google Maps configuration and utilities with fallback system

// API Keys configuration with fallback (supports up to 4 keys)
// Primary key has ALL APIs enabled, fallback keys have Geocoding, Directions, Places APIs
const API_KEYS = [
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY_1,
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY_2,
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY_3,
].filter(key => key && key.trim() !== ''); // Remove empty keys

let currentKeyIndex = 0;
let isScriptLoaded = false;
let scriptLoadPromise: Promise<void> | null = null;

// Get current API key
export const getCurrentAPIKey = (): string => {
  return API_KEYS[currentKeyIndex] || '';
};

// Try next API key in fallback chain
const tryNextKey = (): boolean => {
  if (currentKeyIndex < API_KEYS.length - 1) {
    currentKeyIndex++;
    console.log(`🔄 Trying fallback API key ${currentKeyIndex + 1}/${API_KEYS.length}`);
    return true;
  }
  return false;
};

// Reset to first key (useful for retry scenarios)
export const resetToFirstKey = (): void => {
  currentKeyIndex = 0;
  isScriptLoaded = false;
  scriptLoadPromise = null;
};

// Load Google Maps script with auto-fallback support
export const loadGoogleMapsScript = (forceReload: boolean = false): Promise<void> => {
  if (window.google && window.google.maps && isScriptLoaded && !forceReload) {
    return Promise.resolve();
  }

  if (scriptLoadPromise && !forceReload) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = tryLoadScriptWithAutoFallback();
  return scriptLoadPromise;
};

// Try loading script with automatic fallback through all keys
const tryLoadScriptWithAutoFallback = async (): Promise<void> => {
  let lastError: Error | null = null;
  
  // Try each API key in sequence
  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    try {
      console.log(`🔄 Attempting to load Google Maps (attempt ${attempt + 1}/${API_KEYS.length})...`);
      await tryLoadScript();
      console.log(`✅ Google Maps loaded successfully on attempt ${attempt + 1}`);
      return; // Success!
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Attempt ${attempt + 1} failed:`, error);
      
      // If not the last attempt, try next key
      if (attempt < API_KEYS.length - 1) {
        if (tryNextKey()) {
          console.log(`🔄 Auto-switching to key ${currentKeyIndex + 1} for retry...`);
          // Reset script state for clean retry
          isScriptLoaded = false;
          scriptLoadPromise = null;
          
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }
  
  // All attempts failed
  throw new Error(`❌ All ${API_KEYS.length} Google Maps API keys failed. Last error: ${lastError?.message}`);
};

// Internal function to try loading script with current key
const tryLoadScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (API_KEYS.length === 0) {
      reject(new Error('❌ No valid Google Maps API keys configured'));
      return;
    }

    const currentKey = getCurrentAPIKey();
    console.log(`🗝️ Loading Google Maps with key ${currentKeyIndex + 1}/${API_KEYS.length}: ...${currentKey.slice(-8)}`);

    // Remove any existing script
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${currentKey}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;

    const cleanup = () => {
      script.remove();
    };

    script.onload = () => {
      if (window.google && window.google.maps) {
        console.log(`✅ Google Maps loaded successfully with key ${currentKeyIndex + 1}`);
        isScriptLoaded = true;
        scriptLoadPromise = null;
        resolve();
      } else {
        console.error(`❌ Google Maps object not available after script load`);
        cleanup();
        attemptFallback(resolve, reject);
      }
    };

    script.onerror = (error) => {
      console.error(`❌ Failed to load Google Maps script:`, error);
      cleanup();
      clearTimeout(timeout);
      attemptFallback(resolve, reject);
    };

    // Add timeout for API key validation - reduced to 8 seconds for faster fallback
    const timeout = setTimeout(() => {
      console.error(`⏱️ Google Maps script loading timed out with key ${currentKeyIndex + 1}`);
      cleanup();
      attemptFallback(resolve, reject);
    }, 8000);

    script.addEventListener('load', () => clearTimeout(timeout));
    script.addEventListener('error', () => clearTimeout(timeout));

    document.head.appendChild(script);
  });
};

// Attempt fallback to next API key
const attemptFallback = (resolve: () => void, reject: (error: Error) => void) => {
  if (tryNextKey()) {
    // Try next key
    isScriptLoaded = false;
    scriptLoadPromise = null;
    tryLoadScript().then(resolve).catch(reject);
  } else {
    // All keys exhausted
    reject(new Error('❌ All Google Maps API keys failed. Please check your keys and billing status.'));
  }
};

// Check API key status and availability
export const checkAPIKeyStatus = (): { 
  totalKeys: number; 
  currentKeyIndex: number; 
  currentKey: string;
  hasMoreKeys: boolean;
} => {
  return {
    totalKeys: API_KEYS.length,
    currentKeyIndex: currentKeyIndex,
    currentKey: getCurrentAPIKey() ? `...${getCurrentAPIKey().slice(-8)}` : 'None',
    hasMoreKeys: currentKeyIndex < API_KEYS.length - 1
  };
};

// Calculate distance between two coordinates
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  if (window.google && window.google.maps) {
    const point1 = new google.maps.LatLng(lat1, lng1);
    const point2 = new google.maps.LatLng(lat2, lng2);
    return google.maps.geometry.spherical.computeDistanceBetween(point1, point2) / 1000; // km
  }
  // Fallback: Haversine formula
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Geocode address to coordinates with fallback support
export const geocodeAddress = async (address: string, retryCount: number = 0): Promise<{ lat: number; lng: number } | null> => {
  try {
    if (!window.google || !window.google.maps) {
      await loadGoogleMapsScript();
    }

    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, async (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
          });
        } else if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT') {
          console.error(`❌ Geocoding failed with status: ${status}`);
          // Try fallback key if available and retry count is reasonable
          if (retryCount < API_KEYS.length - 1 && tryNextKey()) {
            console.log('🔄 Retrying geocoding with fallback key...');
            isScriptLoaded = false;
            scriptLoadPromise = null;
            try {
              await loadGoogleMapsScript();
              const fallbackResult = await geocodeAddress(address, retryCount + 1);
              resolve(fallbackResult);
            } catch (error) {
              console.error('❌ Fallback geocoding failed:', error);
              resolve(null);
            }
          } else {
            resolve(null);
          }
        } else {
          console.warn(`⚠️ Geocoding failed: ${status}`);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('❌ Error in geocodeAddress:', error);
    return null;
  }
};

// Demo coordinates for common locations
export const demoLocations: { [key: string]: { lat: number; lng: number } } = {
  'Downtown Station': { lat: 40.7589, lng: -73.9851 },
  'Tech Park Area': { lat: 40.7489, lng: -73.9680 },
  'Airport Terminal': { lat: 40.6413, lng: -73.7781 },
  'City Center': { lat: 40.7580, lng: -73.9855 },
  'University Campus': { lat: 40.7295, lng: -73.9965 },
  'Shopping District': { lat: 40.7614, lng: -73.9776 },
  'Business District': { lat: 40.7549, lng: -73.9840 },
  'Residential Area': { lat: 40.7282, lng: -73.9942 },
};

// Get coordinates for location (with fallback to demo data)
export const getLocationCoordinates = async (
  location: string
): Promise<{ lat: number; lng: number }> => {
  // Check demo locations first
  for (const [key, coords] of Object.entries(demoLocations)) {
    if (location.toLowerCase().includes(key.toLowerCase())) {
      return coords;
    }
  }

  // Try geocoding
  const geocoded = await geocodeAddress(location);
  if (geocoded) {
    return geocoded;
  }

  // Default to NYC
  return { lat: 40.7580, lng: -73.9855 };
};

// Calculate real distance and duration between locations with fallback support
export const calculateRealDistance = async (
  origin: string,
  destination: string,
  waypoints?: string[],
  retryCount: number = 0
): Promise<{
  distance: number; // in kilometers
  duration: number; // in minutes
  distanceText: string;
  durationText: string;
  route?: google.maps.DirectionsRoute;
  directionsResult?: google.maps.DirectionsResult;
} | null> => {
  try {
    if (!window.google || !window.google.maps) {
      await loadGoogleMapsScript();
    }

    return new Promise((resolve) => {
      const directionsService = new google.maps.DirectionsService();

      const waypointsFormatted = waypoints?.map(location => ({
        location,
        stopover: true,
      })) || [];

      directionsService.route(
        {
          origin,
          destination,
          waypoints: waypointsFormatted,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
        },
        async (result, status) => {
          if (status === 'OK' && result) {
            const route = result.routes[0];
            let totalDistance = 0;
            let totalDuration = 0;

            // Sum up distance and duration for all legs
            route.legs.forEach((leg) => {
              if (leg.distance && leg.duration) {
                totalDistance += leg.distance.value; // in meters
                totalDuration += leg.duration.value; // in seconds
              }
            });

            resolve({
              distance: totalDistance / 1000, // convert to km
              duration: totalDuration / 60, // convert to minutes
              distanceText: `${(totalDistance / 1000).toFixed(1)} km`,
              durationText: `${Math.round(totalDuration / 60)} min`,
              route: route,
              directionsResult: result,
            });
          } else if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT') {
            console.error(`❌ Directions request failed with status: ${status}`);
            // Try fallback key if available and retry count is reasonable
            if (retryCount < API_KEYS.length - 1 && tryNextKey()) {
              console.log('🔄 Retrying directions with fallback key...');
              isScriptLoaded = false;
              scriptLoadPromise = null;
              try {
                await loadGoogleMapsScript();
                const fallbackResult = await calculateRealDistance(origin, destination, waypoints, retryCount + 1);
                resolve(fallbackResult);
              } catch (error) {
                console.error('❌ Fallback directions failed:', error);
                resolve(null);
              }
            } else {
              resolve(null);
            }
          } else {
            console.error(`⚠️ Directions request failed: ${status}`);
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error('❌ Error in calculateRealDistance:', error);
    return null;
  }
};

// Calculate distance matrix for multiple origins/destinations with fallback support
export const calculateDistanceMatrix = async (
  origins: string[],
  destinations: string[],
  retryCount: number = 0
): Promise<google.maps.DistanceMatrixResponse | null> => {
  try {
    if (!window.google || !window.google.maps) {
      await loadGoogleMapsScript();
    }

    return new Promise((resolve) => {
      const service = new google.maps.DistanceMatrixService();

      service.getDistanceMatrix(
        {
          origins,
          destinations,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
        },
        async (response, status) => {
          if (status === 'OK' && response) {
            resolve(response);
          } else if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT') {
            console.error(`❌ Distance matrix request failed with status: ${status}`);
            // Try fallback key if available and retry count is reasonable
            if (retryCount < API_KEYS.length - 1 && tryNextKey()) {
              console.log('🔄 Retrying distance matrix with fallback key...');
              isScriptLoaded = false;
              scriptLoadPromise = null;
              try {
                await loadGoogleMapsScript();
                const fallbackResult = await calculateDistanceMatrix(origins, destinations, retryCount + 1);
                resolve(fallbackResult);
              } catch (error) {
                console.error('❌ Fallback distance matrix failed:', error);
                resolve(null);
              }
            } else {
              resolve(null);
            }
          } else {
            console.error(`⚠️ Distance matrix request failed: ${status}`);
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error('❌ Error in calculateDistanceMatrix:', error);
    return null;
  }
};

// Get place details by place ID
export const getPlaceDetails = async (
  placeId: string
): Promise<google.maps.places.PlaceResult | null> => {
  if (!window.google || !window.google.maps) {
    await loadGoogleMapsScript();
  }

  return new Promise((resolve) => {
    const service = new google.maps.places.PlacesService(
      document.createElement('div')
    );

    service.getDetails(
      {
        placeId,
        fields: ['formatted_address', 'geometry', 'name', 'place_id'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          resolve(null);
        }
      }
    );
  });
};

// Calculate dynamic pricing based on distance
export const calculateDynamicPrice = (
  distanceKm: number,
  baseRate: number = 2,
  perKmRate: number = 1.5,
  minimumFare: number = 5
): number => {
  const calculatedPrice = baseRate + (distanceKm * perKmRate);
  return Math.max(calculatedPrice, minimumFare);
};

// Calculate segment-based pricing for intermediate stops
// This allows passengers joining midway to pay reduced fares
export const calculateSegmentPrice = (
  totalDistance: number,
  segmentDistance: number,
  totalPrice: number,
  minimumFare: number = 5
): number => {
  // Calculate the ratio of the segment to total distance
  const distanceRatio = segmentDistance / totalDistance;
  
  // Calculate proportional price based on segment distance
  const segmentPrice = totalPrice * distanceRatio;
  
  // Apply a small base fare to every segment (to cover driver's effort)
  const baseSegmentFare = 2;
  const finalPrice = baseSegmentFare + segmentPrice;
  
  // Ensure minimum fare
  return Math.max(Math.ceil(finalPrice), minimumFare);
};

// Calculate CO2 savings with real distance
export const calculateCO2Savings = (
  distanceKm: number,
  passengers: number = 1
): number => {
  // Average CO2 emission: 120g per km for a car
  // Carpooling saves CO2 by sharing: (passengers / (passengers + 1)) * emission
  const emissionPerKm = 0.12; // kg CO2 per km
  const savingsRatio = passengers / (passengers + 1);
  return distanceKm * emissionPerKm * savingsRatio * passengers;
};

// TypeScript declarations for Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}
