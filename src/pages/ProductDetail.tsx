import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageCircle, CreditCard, Truck, MapPin } from "lucide-react";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewsList } from "@/components/ReviewsList";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PurchaseSuccessModal } from "@/components/PurchaseSuccessModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChatButton } from "@/components/chat/ChatButton";

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
  seller_phone: string | null;
  buyer_name: string | null;
  buyer_place: string | null;
  status: string;
  currency: string;
  user_id: string;
  shipping_method: string | null;
  seller_address: string | null;
  seller_pincode: string | null;
  seller_city: string | null;
  seller_state: string | null;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { exchangeRates } = useCurrency();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewsRefreshTrigger, setReviewsRefreshTrigger] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState({
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [checkingShipping, setCheckingShipping] = useState(false);

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

  const handleBuyClick = () => {
    if (!product) return;
    
    // If seller offers shiprocket, show shipping dialog
    if (product.shipping_method === "shiprocket") {
      setShowShippingDialog(true);
    } else {
      // Direct pickup, proceed to payment
      setSelectedShipping("pickup");
      handleRazorpayPayment();
    }
  };

  const checkShippingCost = async () => {
    if (!product || !deliveryAddress.pincode) return;
    
    setCheckingShipping(true);
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket-service', {
        body: {
          action: 'check_serviceability',
          pickupPincode: product.seller_pincode || '400001',
          deliveryPincode: deliveryAddress.pincode,
          weight: 1, // Default weight in kg
          cod: 0,
        },
      });

      if (error) throw error;

      if (data?.data?.available_courier_companies?.length > 0) {
        const cheapestCourier = data.data.available_courier_companies.reduce((min: any, courier: any) => 
          courier.rate < min.rate ? courier : min
        );
        setShippingCost(cheapestCourier.rate);
      } else {
        toast({
          title: "Delivery not available",
          description: "Shiprocket delivery is not available for this pincode",
          variant: "destructive",
        });
        setShippingCost(null);
      }
    } catch (error: any) {
      console.error('Shipping check error:', error);
      toast({
        title: "Error checking shipping",
        description: "Unable to calculate shipping cost. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckingShipping(false);
    }
  };

  const handleShippingConfirm = () => {
    // Validate delivery address if delivery is selected
    if (selectedShipping === "delivery") {
      if (!deliveryAddress.address || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.pincode) {
        toast({
          title: "Missing information",
          description: "Please fill in all delivery address fields",
          variant: "destructive",
        });
        return;
      }
    }
    setShowShippingDialog(false);
    handleRazorpayPayment();
  };

  const handleRazorpayPayment = async () => {
    if (!product) return;

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Login required",
        description: "Please login to make a purchase",
      });
      navigate("/buyer/login");
      return;
    }

    // Convert price to INR for payment
    const inrRate = exchangeRates['INR'] || 83;
    const priceInINR = Math.round(product.price * inrRate);

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
        description: `Amount: ₹${priceInINR.toFixed(2)}`,
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
        handler: async function (response: any) {
          // Create order record in database
          try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session && product) {
              const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .insert({
                  product_id: product.id,
                  buyer_id: session.user.id,
                  seller_id: product.user_id,
                  razorpay_order_id: data.orderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  amount: priceInINR,
                  currency: 'INR',
                  status: 'completed',
                  buyer_name: session.user.email,
                  buyer_email: session.user.email,
                  shipping_method: selectedShipping,
                  delivery_address: selectedShipping === "delivery" ? deliveryAddress.address : null,
                  delivery_city: selectedShipping === "delivery" ? deliveryAddress.city : null,
                  delivery_state: selectedShipping === "delivery" ? deliveryAddress.state : null,
                  delivery_pincode: selectedShipping === "delivery" ? deliveryAddress.pincode : null,
                })
                .select()
                .single();

              if (orderError) {
                console.error('Error creating order:', orderError);
              }

              // Create Shiprocket order if delivery is selected
              if (selectedShipping === "delivery" && orderData && product.seller_pincode) {
                try {
                  const shiprocketOrderData = {
                    order_id: orderData.id,
                    order_date: new Date().toISOString().split('T')[0],
                    pickup_location: product.seller_location || "Seller Location",
                    billing_customer_name: session.user.email?.split('@')[0] || "Customer",
                    billing_last_name: "",
                    billing_address: deliveryAddress.address,
                    billing_city: deliveryAddress.city,
                    billing_pincode: deliveryAddress.pincode,
                    billing_state: deliveryAddress.state,
                    billing_country: "India",
                    billing_email: session.user.email || "",
                    billing_phone: session.user.phone || "9999999999",
                    shipping_is_billing: true,
                    order_items: [{
                      name: product.name,
                      sku: product.id,
                      units: 1,
                      selling_price: priceInINR,
                    }],
                    payment_method: "Prepaid",
                    sub_total: priceInINR,
                    length: 10,
                    breadth: 10,
                    height: 10,
                    weight: 1,
                  };

                  const { data: shiprocketData, error: shiprocketError } = await supabase.functions.invoke('shiprocket-service', {
                    body: {
                      action: 'create_order',
                      orderData: shiprocketOrderData,
                    },
                  });

                  if (!shiprocketError && shiprocketData) {
                    // Update order with Shiprocket details
                    await supabase
                      .from("orders")
                      .update({
                        shiprocket_order_id: shiprocketData.order_id?.toString(),
                        shiprocket_shipment_id: shiprocketData.shipment_id?.toString(),
                        awb_code: shiprocketData.awb_code,
                        courier_name: shiprocketData.courier_name,
                      })
                      .eq("id", orderData.id);

                    console.log('Shiprocket order created:', shiprocketData);
                  } else {
                    console.error('Shiprocket order creation failed:', shiprocketError);
                  }
                } catch (shiprocketErr) {
                  console.error('Shiprocket error:', shiprocketErr);
                }
              }

              // Update product status to sold
              await supabase
                .from("products")
                .update({ 
                  status: 'sold',
                  buyer_name: session.user.email,
                })
                .eq("id", product.id);

              // Show success modal
              setPurchaseAmount(priceInINR);
              setShowSuccessModal(true);
              
              // Refresh product data
              fetchProduct();
            }
          } catch (err) {
            console.error('Error processing order:', err);
            toast({
              title: "Payment successful but order recording failed",
              description: "Please contact support with your payment ID",
              variant: "destructive",
            });
          }
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

            {/* Shipping Information */}
            {product.shipping_method && (
              <div className="mb-6 p-4 bg-accent/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-5 w-5 text-foreground" />
                  <p className="text-sm font-semibold text-foreground">
                    Shipping Options
                  </p>
                </div>
                {product.shipping_method === "pickup" ? (
                  <p className="text-sm text-muted-foreground">
                    Pickup from seller's location
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-1">
                      • Pickup from seller
                    </p>
                    <p className="text-sm text-muted-foreground">
                      • Delivery via Shiprocket
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Payment Buttons */}
            <div className="space-y-3">
              <Button
                size="lg"
                onClick={handleBuyClick}
                disabled={product.status === "sold"}
                className="w-full gap-2 text-lg py-6"
              >
                <CreditCard className="h-5 w-5" />
                {product.status === "sold" 
                  ? "Sold Out" 
                  : `Pay ₹${Math.round(product.price * (exchangeRates['INR'] || 83)).toFixed(0)} with Razorpay`}
              </Button>
              
              <div className="flex gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleWhatsAppClick}
                  disabled={product.status === "sold"}
                  className="flex-1 gap-2 text-lg py-6"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp
                </Button>
                
                {product.status !== "sold" && (
                  <ChatButton
                    productId={product.id}
                    sellerId={product.user_id}
                    sellerName={product.seller_name || "Seller"}
                    userType="buyer"
                    variant="full"
                  />
                )}
              </div>
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

        {/* Shipping Selection Dialog */}
        <Dialog open={showShippingDialog} onOpenChange={setShowShippingDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Choose Shipping Method</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <RadioGroup value={selectedShipping} onValueChange={(value: "pickup" | "delivery") => setSelectedShipping(value)}>
                <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <div className="flex-1">
                    <Label htmlFor="pickup" className="cursor-pointer font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Pickup from Seller
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Free - Collect from seller's location
                    </p>
                    {product?.seller_location && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Location: {product.seller_location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <div className="flex-1">
                    <Label htmlFor="delivery" className="cursor-pointer font-semibold flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Delivery via Shiprocket
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get it delivered to your address
                    </p>
                  </div>
                </div>
              </RadioGroup>

              {selectedShipping === "delivery" && (
                <div className="space-y-4 p-4 bg-accent/10 rounded-lg">
                  <h3 className="font-semibold">Delivery Address</h3>
                  
                  <div>
                    <Label htmlFor="address">Full Address *</Label>
                    <Textarea
                      id="address"
                      value={deliveryAddress.address}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address: e.target.value })}
                      placeholder="House no., Street, Area"
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={deliveryAddress.city}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                        placeholder="Mumbai"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={deliveryAddress.state}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                        placeholder="Maharashtra"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={deliveryAddress.pincode}
                      onChange={(e) => {
                        setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value });
                        setShippingCost(null);
                      }}
                      placeholder="400001"
                      className="mt-1"
                      onBlur={checkShippingCost}
                    />
                  </div>

                  {checkingShipping && (
                    <p className="text-sm text-muted-foreground">Calculating shipping cost...</p>
                  )}

                  {shippingCost !== null && (
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm font-semibold">Estimated Shipping Cost: ₹{shippingCost.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">This will be added to your total</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleShippingConfirm} className="flex-1">
                  Continue to Payment
                </Button>
                <Button variant="outline" onClick={() => setShowShippingDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Purchase Success Modal */}
        {product && (
          <PurchaseSuccessModal
            open={showSuccessModal}
            onOpenChange={setShowSuccessModal}
            productName={product.name}
            amount={purchaseAmount}
          />
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
