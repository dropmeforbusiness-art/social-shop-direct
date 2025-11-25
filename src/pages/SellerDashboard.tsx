import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Image as ImageIcon, LogOut, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  seller_phone: string | null;
  status: string | null;
}

interface Order {
  id: string;
  amount: number;
  currency: string;
  status: string;
  buyer_name: string | null;
  buyer_email: string | null;
  created_at: string;
  products: {
    name: string;
    image_url: string | null;
  };
}

const SellerDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    status: "available",
  });
  const [sellerPhone, setSellerPhone] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/seller/login");
      return;
    }

    // Get seller phone
    const { data: profile } = await supabase
      .from("seller_profiles")
      .select("phone")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!profile) {
      toast({
        title: "Error",
        description: "Seller profile not found",
        variant: "destructive",
      });
      navigate("/seller/login");
      return;
    }

    setSellerPhone(profile.phone);
    fetchProducts(profile.phone);
    fetchOrders(profile.phone);
  };

  const fetchProducts = async (phone: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_phone", phone)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setProducts(data || []);
    setLoading(false);
  };

  const fetchOrders = async (phone: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        products!inner (
          name,
          image_url,
          seller_phone
        )
      `)
      .eq("products.seller_phone", phone)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading orders:", error);
    } else {
      setOrders(data || []);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/seller/login");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      status: "available",
    });
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          status: formData.status,
        })
        .eq("id", editingProduct.id);

      if (error) throw error;

      toast({ title: "Success", description: "Product updated" });
      resetForm();
      setIsDialogOpen(false);
      fetchProducts(sellerPhone);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      status: product.status || "available",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Success", description: "Product deleted" });
    fetchProducts(sellerPhone);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Seller Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">My Products</h2>
          <p className="text-muted-foreground">Manage your product listings</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Update Product
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {products.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No products found. Contact admin to add products with your phone number.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader className="p-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {product.description || "No description"}
                  </p>
                  <p className="text-xl font-bold mb-2">${product.price}</p>
                  <div className="mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.status === 'sold' ? 'bg-red-100 text-red-800' : 
                      product.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {product.status || 'available'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Sold Products / Sales Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Your Sales</h2>
          {orders.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No sales yet. Your sold products will appear here.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{order.products.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Sold on {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xl font-bold text-primary">₹{order.amount.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Buyer</p>
                        <p className="font-medium">{order.buyer_name || order.buyer_email}</p>
                        {order.buyer_email && (
                          <p className="text-sm text-muted-foreground">{order.buyer_email}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard;
