import { Card, CardContent } from "@/components/ui/card";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  buyerName?: string | null;
  buyerPlace?: string | null;
}

export const ProductCard = ({ id, name, description, price, imageUrl, buyerName, buyerPlace }: ProductCardProps) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="aspect-square overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="mb-1 font-semibold text-foreground">{name}</h3>
        {description && (
          <p className="mb-2 text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
        <p className="text-lg font-bold text-primary mb-2">${price.toFixed(2)}</p>
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
