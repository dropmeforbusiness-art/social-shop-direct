import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ShoppingBag, Store, Heart, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export const UserMenu = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [isBuyer, setIsBuyer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        // Check if user has seller profile
        const { data: sellerProfile } = await supabase
          .from("seller_profiles")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        setIsSeller(!!sellerProfile);
        
        // Check if user has buyer profile
        const { data: buyerProfile } = await supabase
          .from("buyer_profiles")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        setIsBuyer(!!buyerProfile);
      }
      
      setLoading(false);
    };

    checkUserStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsSeller(false);
        setIsBuyer(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/buyer/login")}>
          Login
        </Button>
        <Button size="sm" onClick={() => navigate("/seller/login")}>
          Sell
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Account</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">My Account</span>
            <span className="text-xs text-muted-foreground truncate">
              {user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isBuyer && (
          <DropdownMenuItem onClick={() => navigate("/buyer/dashboard")} className="cursor-pointer">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Buyer Dashboard
          </DropdownMenuItem>
        )}
        
        {isSeller && (
          <DropdownMenuItem onClick={() => navigate("/seller/dashboard")} className="cursor-pointer">
            <Store className="h-4 w-4 mr-2" />
            Seller Dashboard
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => navigate("/wishlist")} className="cursor-pointer">
          <Heart className="h-4 w-4 mr-2" />
          Wishlist
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {!isSeller && (
          <DropdownMenuItem onClick={() => navigate("/seller/login")} className="cursor-pointer">
            <Store className="h-4 w-4 mr-2" />
            Become a Seller
          </DropdownMenuItem>
        )}
        
        {!isBuyer && (
          <DropdownMenuItem onClick={() => navigate("/buyer/login")} className="cursor-pointer">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Register as Buyer
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
