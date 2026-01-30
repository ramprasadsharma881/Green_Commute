import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ride: {
    id: string;
    driverName?: string;
    passengerName?: string;
    driverPhoto?: string;
    passengerPhoto?: string;
    isDriver?: boolean;
  };
  onSubmit: (rating: {
    rating: number;
    review: string;
    isAnonymous: boolean;
  }) => void;
}

export function RatingModal({
  open,
  onOpenChange,
  ride,
  onSubmit,
}: RatingModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otherUserName = ride.isDriver
    ? ride.passengerName
    : ride.driverName;
  const otherUserPhoto = ride.isDriver
    ? ride.passengerPhoto
    : ride.driverPhoto;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a star rating',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      onSubmit({
        rating,
        review,
        isAnonymous,
      });

      toast({
        title: '⭐ Rating Submitted!',
        description: 'Thank you for your feedback',
      });

      // Reset and close
      setRating(0);
      setReview('');
      setIsAnonymous(false);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit rating',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = [
    'Poor',
    'Fair',
    'Good',
    'Very Good',
    'Excellent',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rate Your Ride</DialogTitle>
          <DialogDescription>
            Help others by sharing your experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={otherUserPhoto} />
              <AvatarFallback>{otherUserName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{otherUserName}</p>
              <p className="text-sm text-muted-foreground">
                {ride.isDriver ? 'Passenger' : 'Driver'}
              </p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="text-center space-y-3">
            <Label className="text-base">How was your experience?</Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm font-medium text-primary">
                {ratingLabels[rating - 1]}
              </p>
            )}
          </div>

          {/* Written Review */}
          <div className="space-y-2">
            <Label htmlFor="review">
              Share your experience (optional)
            </Label>
            <Textarea
              id="review"
              placeholder="Tell us about your ride..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {review.length}/500
            </p>
          </div>

          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="anonymous">Post anonymously</Label>
              <p className="text-sm text-muted-foreground">
                Your name won't be shown with this review
              </p>
            </div>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>

          {/* Quick Tags (Optional enhancement) */}
          {rating >= 4 && (
            <div className="space-y-2">
              <Label>What went well?</Label>
              <div className="flex flex-wrap gap-2">
                {['Punctual', 'Friendly', 'Clean Vehicle', 'Safe Driving', 'Good Conversation'].map(
                  (tag) => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setReview((prev) =>
                          prev ? `${prev}, ${tag}` : tag
                        );
                      }}
                    >
                      {tag}
                    </Button>
                  )
                )}
              </div>
            </div>
          )}

          {rating > 0 && rating <= 2 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                We're sorry to hear that. Would you like to report a safety concern?
              </p>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-yellow-600 dark:text-yellow-400"
              >
                Report an issue
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Skip for now
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Rating
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
