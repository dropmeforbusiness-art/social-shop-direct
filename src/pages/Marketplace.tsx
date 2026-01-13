import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { CountrySelector } from "@/components/CountrySelector";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  buyer_name: string | null;
  buyer_place: string | null;
  status: string;
  created_at: string;
  currency: string;
  seller_country: string | null;
}

interface SponsoredProduct extends Product {
  campaignId: string;
}

const Marketplace = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sponsoredProducts, setSponsoredProducts] = useState<SponsoredProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { countries } = useCurrency();

  useEffect(() => {
    fetchProducts();
    fetchSponsoredProducts();

    const channel = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => {
          fetchProducts();
          fetchSponsoredProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, sortBy, countryFilter, sponsoredProducts]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .neq("status", "sold")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSponsoredProducts = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: campaigns, error } = await supabase
        .from("ad_campaigns")
        .select(`
          id,
          product_id,
          products (*)
        `)
        .eq("status", "active")
        .lte("start_date", today)
        .gte("end_date", today);

      if (error) throw error;

      const sponsored: SponsoredProduct[] = (campaigns || [])
        .filter(c => c.products && (c.products as any).status !== 'sold')
        .map(c => ({
          ...(c.products as any),
          campaignId: c.id,
        }));

      setSponsoredProducts(sponsored);
    } catch (error) {
      console.error("Error fetching sponsored products:", error);
    }
  };

  const trackImpression = useCallback(async (campaignId: string) => {
    try {
      // Get current impressions and increment
      const { data: campaign } = await supabase
        .from('ad_campaigns')
        .select('impressions')
        .eq('id', campaignId)
        .single();
      
      if (campaign) {
        await supabase
          .from('ad_campaigns')
          .update({ impressions: (campaign.impressions || 0) + 1 })
          .eq('id', campaignId);
      }
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.error("Failed to track impression:", error);
    }
  }, []);

  const trackClick = useCallback(async (campaignId: string) => {
    try {
      // Get current clicks and increment
      const { data: campaign } = await supabase
        .from('ad_campaigns')
        .select('clicks')
        .eq('id', campaignId)
        .single();
      
      if (campaign) {
        await supabase
          .from('ad_campaigns')
          .update({ clicks: (campaign.clicks || 0) + 1 })
          .eq('id', campaignId);
      }
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  }, []);

  const filterAndSortProducts = () => {
    // Get sponsored product IDs to exclude from regular list
    const sponsoredIds = new Set(sponsoredProducts.map(p => p.id));
    
    let filtered = products.filter(p => !sponsoredIds.has(p.id));

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by country
    if (countryFilter !== "all") {
      filtered = filtered.filter(product => product.seller_country === countryFilter);
    }

    // Sort products
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredProducts(filtered);
  };

  // Filter sponsored products based on search and country
  const getFilteredSponsoredProducts = () => {
    let filtered = [...sponsoredProducts];

    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (countryFilter !== "all") {
      filtered = filtered.filter(product => product.seller_country === countryFilter);
    }

    return filtered;
  };

  const filteredSponsored = getFilteredSponsoredProducts();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground cursor-pointer" onClick={() => navigate("/")}>
              Flipp.
            </h1>
            <nav className="flex items-center gap-4">
              <CountrySelector />
              <Button variant="ghost" onClick={() => navigate("/")}>
                Sell
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="bg-background py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-8">
            What are you looking for today?
          </h2>
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Apple iPad 128GB"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg rounded-full border-2 border-border focus:border-foreground"
            />
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-foreground">All Products</h3>
            <p className="text-muted-foreground text-sm">Browse active listings</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[160px] rounded-full border-2 border-border">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country.id} value={country.code}>
                      {country.flag_emoji} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">Sort:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] rounded-full border-2 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 && filteredSponsored.length === 0 ? (
          <div className="text-center py-16">
            {searchQuery ? (
              <>
                <h3 className="text-2xl font-bold text-foreground mb-2">No results</h3>
                <p className="text-muted-foreground">
                  No products match "{searchQuery}"
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No products yet</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Sponsored products first */}
            {filteredSponsored.map((product) => (
              <ProductCard
                key={`sponsored-${product.id}`}
                id={product.id}
                name={product.name}
                description={product.description || ""}
                price={product.price}
                imageUrl={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"}
                buyerName={product.buyer_name}
                buyerPlace={product.buyer_place}
                currency={product.currency}
                isSponsored={true}
                onImpression={() => trackImpression(product.campaignId)}
                onClickTrack={() => trackClick(product.campaignId)}
              />
            ))}
            {/* Regular products */}
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description || ""}
                price={product.price}
                imageUrl={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"}
                buyerName={product.buyer_name}
                buyerPlace={product.buyer_place}
                currency={product.currency}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
