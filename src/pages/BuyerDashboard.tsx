import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, LogOut, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChatButton } from "@/components/chat/ChatButton";

interface Order {
  id: string;
  amount: number;
  currency: string;
  status: string;
  razorpay_payment_id: string | null;
  created_at: string;
  shipping_method: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_pincode: string | null;
  awb_code: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  shiprocket_order_id: string | null;
  products: {
    id: string;
    name: string;
    image_url: string | null;
    seller_name: string | null;
    seller_phone: string | null;
    seller_location: string | null;
  };
}

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/buyer/login");
      return;
    }

    setUserEmail(session.user.email || "");
    fetchOrders();
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          products (
            id,
            name,
            image_url,
            seller_name,
            seller_phone,
            seller_location
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleContactSeller = (phone: string | null) => {
    if (phone) {
      window.open(`https://wa.me/${phone.replace(/\+/g, '')}`, "_blank");
    } else {
      toast({
        title: "Contact unavailable",
        description: "Seller phone number not available",
        variant: "destructive",
      });
    }
  };

  const handleTrackShipment = async (awbCode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket-service', {
        body: {
          action: 'track_shipment',
          awbCode: awbCode,
        },
      });

      if (error) throw error;

      if (data?.tracking_data) {
        toast({
          title: "Shipment Status",
          description: `Current status: ${data.tracking_data.shipment_status || 'In transit'}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Unable to fetch tracking information",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading your purchases...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/marketplace")}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Button>
            <h1 className="text-4xl font-bold text-foreground">My Purchases</h1>
            <p className="text-muted-foreground mt-2">{userEmail}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/wishlist")} className="gap-2">
              <Heart className="h-4 w-4" />
              Wishlist
            </Button>
            <ChatButton userType="buyer" variant="full" />
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-foreground mb-2">No purchases yet</p>
              <p className="text-muted-foreground mb-4">
                Start shopping on the marketplace
              </p>
              <Button onClick={() => navigate("/marketplace")}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{order.products.name}</CardTitle>
                      <CardDescription>
                        Order placed on {new Date(order.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Product Image */}
                    <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                      <img
                        src={order.products.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"}
                        alt={order.products.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Order Details */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Payment Details</h3>
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            Amount: <span className="text-foreground font-medium">
                              ₹{order.amount.toFixed(2)}
                            </span>
                          </p>
                          {order.razorpay_payment_id && (
                            <p className="text-muted-foreground">
                              Payment ID: <span className="text-foreground font-mono text-xs">
                                {order.razorpay_payment_id}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Shipping Information */}
                      {order.shipping_method && (
                        <>
                          <div>
                            <h3 className="font-semibold text-foreground mb-2">Shipping Details</h3>
                            <div className="space-y-1 text-sm">
                              <p className="text-muted-foreground">
                                Method: <span className="text-foreground capitalize">{order.shipping_method}</span>
                              </p>
                              {order.shipping_method === "delivery" && order.delivery_address && (
                                <>
                                  <p className="text-muted-foreground">
                                    Address: <span className="text-foreground">{order.delivery_address}</span>
                                  </p>
                                  <p className="text-muted-foreground">
                                    <span className="text-foreground">
                                      {order.delivery_city}, {order.delivery_state} - {order.delivery_pincode}
                                    </span>
                                  </p>
                                </>
                              )}
                              {order.awb_code && (
                                <>
                                  <p className="text-muted-foreground mt-2">
                                    AWB Code: <span className="text-foreground font-mono">{order.awb_code}</span>
                                  </p>
                                  {order.courier_name && (
                                    <p className="text-muted-foreground">
                                      Courier: <span className="text-foreground">{order.courier_name}</span>
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                            {order.awb_code && (
                              <Button
                                onClick={() => handleTrackShipment(order.awb_code!)}
                                className="mt-4 w-full"
                                variant="outline"
                              >
                                Track Shipment
                              </Button>
                            )}
                          </div>
                          <Separator />
                        </>
                      )}

                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Seller Information</h3>
                        <div className="space-y-1 text-sm">
                          {order.products.seller_name && (
                            <p className="text-muted-foreground">
                              Name: <span className="text-foreground">{order.products.seller_name}</span>
                            </p>
                          )}
                          {order.products.seller_location && (
                            <p className="text-muted-foreground">
                              Location: <span className="text-foreground">{order.products.seller_location}</span>
                            </p>
                          )}
                        </div>
                        {order.products.seller_phone && (
                          <Button
                            onClick={() => handleContactSeller(order.products.seller_phone)}
                            className="mt-4 w-full"
                            variant="outline"
                          >
                            Contact Seller on WhatsApp
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;