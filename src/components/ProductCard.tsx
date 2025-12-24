import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PriceDisplay } from "@/components/PriceDisplay";
import { Star } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WishlistButton } from "@/components/wishlist/WishlistButton";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  buyerName?: string | null;
  buyerPlace?: string | null;
  currency?: string;
}

export const ProductCard = ({ id, name, description, price, imageUrl, buyerName, buyerPlace, currency = 'USD' }: ProductCardProps) => {
  const navigate = useNavigate();
  const fallbackImage = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop";
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetchRating();
  }, [id]);

  const fetchRating = async () => {
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("rating")
        .eq("product_id", id);

      if (error) throw error;

      if (data && data.length > 0) {
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setReviewCount(data.length);
      }
    } catch (error) {
      console.error("Error fetching rating:", error);
    }
  };
  
  return (
    <Card 
      className="overflow-hidden transition-all hover:shadow-lg cursor-pointer group"
      onClick={() => navigate(`/product/${id}`)}
    >
      <div className="aspect-square overflow-hidden bg-muted relative">
        <img
          src={imageUrl || fallbackImage}
          alt={name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = fallbackImage;
          }}
        />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <WishlistButton productId={id} />
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="mb-1 font-semibold text-foreground">{name}</h3>
        {description && (
          <p className="mb-2 text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
        <PriceDisplay price={price} currency={currency} className="text-lg text-primary mb-2" showOriginal={false} />
        
        {averageRating !== null && reviewCount > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm font-medium text-foreground">{averageRating}</span>
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          </div>
        )}
        
        {buyerName && (
          <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
            <p>Buyer: {buyerName}</p>
            {buyerPlace && <p>Location: {buyerPlace}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
