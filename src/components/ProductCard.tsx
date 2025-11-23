import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Instagram, ExternalLink } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    image: string;
    status: "available" | "sold";
    source: "whatsapp" | "instagram";
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const SourceIcon = product.source === "whatsapp" ? MessageCircle : Instagram;

  return (
    <Card className="group overflow-hidden border-border/50 transition-all hover:shadow-lg hover:shadow-primary/5">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}
        <img
          src={product.image}
          alt={product.title}
          className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute right-2 top-2 flex gap-2">
          <Badge
            variant={product.status === "available" ? "default" : "secondary"}
            className="backdrop-blur-sm"
          >
            {product.status}
          </Badge>
          <div className="rounded-full bg-background/80 p-2 backdrop-blur-sm">
            <SourceIcon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-2 line-clamp-1 font-semibold text-foreground">
          {product.title}
        </h3>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">
            ${product.price.toFixed(2)}
          </span>
        </div>
        <Button
          className="w-full gap-2"
          variant={product.status === "sold" ? "secondary" : "default"}
          disabled={product.status === "sold"}
        >
          {product.status === "sold" ? (
            "Sold Out"
          ) : (
            <>
              View Link
              <ExternalLink className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
