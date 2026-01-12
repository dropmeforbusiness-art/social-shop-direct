import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Eye, MousePointer, IndianRupee, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  status: string | null;
}

interface Campaign {
  id: string;
  product_id: string;
  start_date: string;
  end_date: string;
  daily_rate: number;
  total_budget: number;
  total_spent: number;
  impressions: number;
  clicks: number;
  status: string;
  created_at: string;
  products?: {
    name: string;
    image_url: string | null;
  };
}

interface AdCampaignManagerProps {
  products: Product[];
  sellerId: string;
}

const DAILY_RATE = 100;
const MIN_DAYS = 7;
const MAX_DAYS = 180;

declare global {
  interface Window {
    Razorpay: any;
  }
}

const AdCampaignManager = ({ products, sellerId }: AdCampaignManagerProps) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [duration, setDuration] = useState<number>(7);
  const { toast } = useToast();

  const availableProducts = products.filter(p => p.status === 'available');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select(`
          *,
          products (
            name,
            image_url
          )
        `)
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalBudget = (days: number) => days * DAILY_RATE;

  const handleCreateCampaign = async () => {
    if (!selectedProduct) {
      toast({
        title: "Select a product",
        description: "Please select a product to promote",
        variant: "destructive",
      });
      return;
    }

    if (duration < MIN_DAYS || duration > MAX_DAYS) {
      toast({
        title: "Invalid duration",
        description: `Campaign must be between ${MIN_DAYS} and ${MAX_DAYS} days`,
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    const totalBudget = calculateTotalBudget(duration);

    try {
      // Create Razorpay order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: totalBudget,
          currency: 'INR',
          productName: `Ad Campaign - ${duration} days`,
          productId: selectedProduct,
        },
      });

      if (orderError) throw orderError;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration - 1);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Flipp Ads",
        description: `${duration} days ad campaign`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const { error: insertError } = await supabase
              .from("ad_campaigns")
              .insert({
                product_id: selectedProduct,
                seller_id: sellerId,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                daily_rate: DAILY_RATE,
                total_budget: totalBudget,
                status: 'active',
                razorpay_order_id: orderData.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
              });

            if (insertError) throw insertError;

            toast({
              title: "Campaign created!",
              description: `Your ad campaign is now live for ${duration} days`,
            });

            setDialogOpen(false);
            setSelectedProduct("");
            setDuration(7);
            fetchCampaigns();
          } catch (err) {
            console.error("Error creating campaign:", err);
            toast({
              title: "Error",
              description: "Payment successful but campaign creation failed. Contact support.",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: function () {
            toast({
              title: "Payment cancelled",
              description: "Campaign was not created",
            });
          },
        },
        theme: {
          color: "#000000",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const getCampaignStatus = (campaign: Campaign) => {
    const today = new Date();
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);

    if (campaign.status !== 'active') return campaign.status;
    if (today < start) return 'scheduled';
    if (today > end) return 'completed';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  };

  const calculateCPC = (spent: number, clicks: number) => {
    if (clicks === 0) return 0;
    return (spent / clicks).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ad Campaigns</h2>
          <p className="text-muted-foreground">Promote your products and track performance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={availableProducts.length === 0}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Ad Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Select Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a product to promote" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Campaign Duration (days)</Label>
                <Input
                  type="number"
                  min={MIN_DAYS}
                  max={MAX_DAYS}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || MIN_DAYS)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum {MIN_DAYS} days, maximum {MAX_DAYS} days
                </p>
              </div>

              <div className="p-4 bg-accent/10 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Rate</span>
                  <span className="font-medium">₹{DAILY_RATE}/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{duration} days</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Total Cost</span>
                  <span className="font-bold text-primary">₹{calculateTotalBudget(duration)}</span>
                </div>
              </div>

              <Button
                onClick={handleCreateCampaign}
                disabled={creating || !selectedProduct}
                className="w-full"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₹{calculateTotalBudget(duration)} & Start Campaign
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <Card className="p-8 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No campaigns yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first ad campaign to get more visibility for your products
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const status = getCampaignStatus(campaign);
            return (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {campaign.products?.image_url && (
                        <img
                          src={campaign.products.image_url}
                          alt={campaign.products.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{campaign.products?.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(status)}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                          <Eye className="h-3 w-3" />
                          Impressions
                        </div>
                        <p className="font-bold text-lg">{campaign.impressions.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                          <MousePointer className="h-3 w-3" />
                          Clicks
                        </div>
                        <p className="font-bold text-lg">{campaign.clicks.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <div className="text-muted-foreground text-sm">CTR</div>
                        <p className="font-bold text-lg">{calculateCTR(campaign.clicks, campaign.impressions)}%</p>
                      </div>
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                          <IndianRupee className="h-3 w-3" />
                          Spent
                        </div>
                        <p className="font-bold text-lg">₹{campaign.total_spent}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdCampaignManager;
