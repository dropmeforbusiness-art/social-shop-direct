import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageCircle, CreditCard } from "lucide-react";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewsList } from "@/components/ReviewsList";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/contexts/CurrencyContext";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  seller_name: string | null;
  seller_location: string | null;
  buyer_name: string | null;
  buyer_place: string | null;
  status: string;
  currency: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { exchangeRates } = useCurrency();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewsRefreshTrigger, setReviewsRefreshTrigger] = useState(0);

  const fallbackImage = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop";

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Product not found",
          description: "This product doesn't exist",
          variant: "destructive",
        });
        navigate("/marketplace");
        return;
      }

      setProduct(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load product",
        variant: "destructive",
      });
      navigate("/marketplace");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    if (!product) return;

    const message = encodeURIComponent(
      `Hi! I'm interested in buying: ${product.name}\nPrice: $${product.price.toFixed(2)}\n\nProduct Link: ${window.location.href}`
    );

    // WhatsApp link format - opens WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/971558201813?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleRazorpayPayment = async () => {
    if (!product) return;

    // Convert price to INR for payment
    const inrRate = exchangeRates['INR'] || 83; // Fallback rate if not available
    const priceInINR = product.currency === 'INR' 
      ? product.price 
      : product.price * inrRate;

    // Validate minimum amount for Razorpay (₹1 minimum)
    if (priceInINR < 1) {
      toast({
        title: "Payment not available",
        description: "This product's price is too low for online payment. Please use WhatsApp to purchase.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Creating payment order...",
        description: "Please wait",
      });

      // Create order via edge function with INR amount
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: priceInINR,
          currency: 'INR',
          productName: product.name,
          productId: product.id,
        },
      });

      if (error) throw error;

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Flipp",
        description: product.name,
        image: product.image_url || fallbackImage,
        order_id: data.orderId,
        method: {
          upi: true,
          card: true,
          netbanking: false,
          wallet: true,
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#000000",
        },
        handler: function (response: any) {
          toast({
            title: "Payment successful!",
            description: "Your payment has been processed. We'll contact you shortly via WhatsApp.",
          });
          console.log('Payment Success:', response);
        },
        modal: {
          ondismiss: function () {
            toast({
              title: "Payment cancelled",
              description: "You can try again anytime",
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate("/marketplace")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={product.image_url || fallbackImage}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = fallbackImage;
              }}
            />
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                {product.name}
              </h1>

              {product.description && (
                <p className="text-lg text-muted-foreground mb-6">
                  {product.description}
                </p>
              )}

              <div className="mb-6">
                <p className="text-3xl font-bold text-primary">
                  ${product.price.toFixed(2)}
                </p>
              </div>

              {product.seller_name && (
                <div className="mb-6 p-4 bg-accent/10 rounded-lg">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Seller Information
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {product.seller_name}
                  </p>
                  {product.seller_location && (
                    <p className="text-sm text-muted-foreground">
                      {product.seller_location}
                    </p>
                  )}
                </div>
              )}

              {product.status === "sold" && product.buyer_name && (
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    This item has been sold
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Buyer: {product.buyer_name}
                  </p>
                  {product.buyer_place && (
                    <p className="text-sm text-muted-foreground">
                      Location: {product.buyer_place}
                    </p>
                  )}
                </div>
              )}

              {/* Share Link Section */}
              <div className="mb-6 p-4 bg-accent/10 rounded-lg">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Share this product
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={window.location.href}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({
                        title: "Link copied!",
                        description: "Product link copied to clipboard",
                      });
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="space-y-3">
              <Button
                size="lg"
                onClick={handleRazorpayPayment}
                disabled={product.status === "sold"}
                className="w-full gap-2 text-lg py-6"
              >
                <CreditCard className="h-5 w-5" />
                {product.status === "sold" 
                  ? "Sold Out" 
                  : `Pay ₹${(product.currency === 'INR' 
                      ? product.price 
                      : product.price * (exchangeRates['INR'] || 83)
                    ).toFixed(2)} with Razorpay`}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={handleWhatsAppClick}
                disabled={product.status === "sold"}
                className="w-full gap-2 text-lg py-6"
              >
                <MessageCircle className="h-5 w-5" />
                {product.status === "sold" ? "Sold Out" : "Contact on WhatsApp"}
              </Button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-foreground mb-6">Customer Reviews</h2>
          
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <ReviewsList 
                productId={product.id} 
                refreshTrigger={reviewsRefreshTrigger}
              />
            </div>
            <div>
              <ReviewForm 
                productId={product.id}
                onReviewSubmitted={() => setReviewsRefreshTrigger(prev => prev + 1)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
