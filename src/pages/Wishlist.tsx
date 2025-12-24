import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    status: string | null;
    seller_name: string | null;
  };
}

const Wishlist = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/buyer/login");
      return;
    }

    fetchWishlist();
  };

  const fetchWishlist = async () => {
    const { data, error } = await supabase
      .from("wishlists")
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_url,
          status,
          seller_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load wishlist");
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const removeFromWishlist = async (id: string) => {
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to remove item");
    } else {
      setItems(items.filter((item) => item.id !== id));
      toast.success("Removed from wishlist");
    }
  };

  const fallbackImage = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/marketplace")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-red-500 fill-red-500" />
          <h1 className="text-4xl font-bold text-foreground">My Wishlist</h1>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-foreground mb-2">
                Your wishlist is empty
              </p>
              <p className="text-muted-foreground mb-4">
                Save products you like by clicking the heart icon
              </p>
              <Button onClick={() => navigate("/marketplace")}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/product/${item.products.id}`)}
              >
                <div className="relative aspect-square">
                  <img
                    src={item.products.image_url || fallbackImage}
                    alt={item.products.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = fallbackImage;
                    }}
                  />
                  {item.products.status === "sold" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">SOLD</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(item.id);
                    }}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg truncate mb-1">
                    {item.products.name}
                  </h3>
                  {item.products.seller_name && (
                    <p className="text-sm text-muted-foreground mb-2">
                      by {item.products.seller_name}
                    </p>
                  )}
                  <p className="text-xl font-bold text-primary">
                    ${item.products.price.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
