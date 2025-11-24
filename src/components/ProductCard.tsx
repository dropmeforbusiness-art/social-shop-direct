import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PriceDisplay } from "@/components/PriceDisplay";

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
  
  return (
    <Card 
      className="overflow-hidden transition-all hover:shadow-lg cursor-pointer"
      onClick={() => navigate(`/product/${id}`)}
    >
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={imageUrl || fallbackImage}
          alt={name}
          className="h-full w-full object-cover transition-transform hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = fallbackImage;
          }}
        />
      </div>
      <CardContent className="p-4">
        <h3 className="mb-1 font-semibold text-foreground">{name}</h3>
        {description && (
          <p className="mb-2 text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
        <PriceDisplay price={price} currency={currency} className="text-lg text-primary mb-2" showOriginal={false} />
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
