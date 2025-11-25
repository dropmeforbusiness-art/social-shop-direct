import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface ReviewsListProps {
  productId: string;
  refreshTrigger: number;
}

export const ReviewsList = ({ productId, refreshTrigger }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [productId, refreshTrigger]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);
      
      if (data && data.length > 0) {
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      } else {
        setAverageRating(0);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-primary text-primary" : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading reviews...</p>;
  }

  return (
    <div className="space-y-6">
      {reviews.length > 0 && (
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            {renderStars(Math.round(averageRating))}
            <span className="text-2xl font-bold text-foreground">{averageRating}</span>
          </div>
          <span className="text-muted-foreground">
            Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </span>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 bg-accent/5 rounded-lg space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{review.user_name}</p>
                  {renderStars(review.rating)}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
