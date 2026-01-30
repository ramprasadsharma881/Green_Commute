import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadGoogleMapsScript } from '@/lib/googleMaps';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  id?: string;
  required?: boolean;
}

export const LocationAutocomplete = ({
  value,
  onChange,
  placeholder = 'Enter location',
  className,
  onPlaceSelect,
  id,
  required = false,
}: LocationAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSelection, setIsValidSelection] = useState(false);

  useEffect(() => {
    const initAutocomplete = async () => {
      try {
        setIsLoading(true);
        await loadGoogleMapsScript();

        if (!inputRef.current) return;

        // Initialize Google Places Autocomplete
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode', 'establishment'],
          fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components'],
        });

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          
          if (place && place.formatted_address) {
            setIsValidSelection(true);
            onChange(place.formatted_address, place);
            
            if (onPlaceSelect) {
              onPlaceSelect(place);
            }
          }
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize autocomplete:', error);
        setIsLoading(false);
      }
    };

    initAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange, onPlaceSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mark as invalid when user types (until they select from dropdown)
    if (e.target.value !== value) {
      setIsValidSelection(false);
    }
    onChange(e.target.value);
  };

  const handleBlur = () => {
    // Show warning if required and not a valid selection
    if (required && value && !isValidSelection && value.length < 10) {
      console.warn('Please select a location from the dropdown suggestions');
    }
  };

  return (
    <div className="relative">
      <MapPin className={cn(
        "absolute left-3 top-3 h-4 w-4 z-10",
        isValidSelection ? "text-green-600" : "text-muted-foreground"
      )} />
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={isLoading ? 'Loading...' : placeholder}
        className={cn(
          'pl-10',
          isValidSelection && 'border-green-500',
          className
        )}
        disabled={isLoading}
        autoComplete="off"
      />
      {required && value && !isValidSelection && value.length >= 3 && (
        <div className="absolute right-3 top-3 z-10">
          <div className="h-4 w-4 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
            <span className="text-xs text-amber-600 dark:text-amber-400">!</span>
          </div>
        </div>
      )}
    </div>
  );
};
