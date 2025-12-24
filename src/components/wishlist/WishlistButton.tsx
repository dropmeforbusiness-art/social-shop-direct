import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  variant?: "icon" | "full";
  className?: string;
}

export const WishlistButton = ({
  productId,
  variant = "icon",
  className,
}: WishlistButtonProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId && productId) {
      checkWishlistStatus();
    }
  }, [userId, productId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const checkWishlistStatus = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .maybeSingle();

    setIsWishlisted(!!data);
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast.error("Please log in to save products");
      return;
    }

    setLoading(true);

    try {
      if (isWishlisted) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId);

        if (error) throw error;
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({
            user_id: userId,
            product_id: productId,
          });

        if (error) throw error;
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch (error: any) {
      toast.error("Failed to update wishlist");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleWishlist}
        disabled={loading}
        className={cn(
          "h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background",
          className
        )}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            isWishlisted ? "fill-red-500 text-red-500" : "text-foreground"
          )}
        />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={toggleWishlist}
      disabled={loading}
      className={cn("gap-2", className)}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          isWishlisted ? "fill-red-500 text-red-500" : ""
        )}
      />
      {isWishlisted ? "Saved" : "Save for Later"}
    </Button>
  );
};
