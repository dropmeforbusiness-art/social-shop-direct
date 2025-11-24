import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { User } from "@supabase/supabase-js";
import { Pencil, Trash2, Plus } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  price: z.number().positive("Price must be positive").max(999999, "Price too high"),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  sellerName: z.string().max(100, "Seller name too long").optional(),
  sellerLocation: z.string().max(100, "Seller location too long").optional(),
  sellerCountry: z.string().max(2, "Use 2-letter country code").optional(),
  buyerName: z.string().max(100, "Buyer name too long").optional(),
  buyerPlace: z.string().max(100, "Buyer place too long").optional(),
});

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  seller_name: string | null;
  seller_location: string | null;
  seller_country: string | null;
  buyer_name: string | null;
  buyer_place: string | null;
  status: string;
}

const AdminProducts = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    sellerName: "",
    sellerLocation: "",
    sellerCountry: "",
    buyerName: "",
    buyerPlace: "",
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/admin/login");
      } else {
        setUser(session.user);
        setTimeout(() => checkAdminStatus(), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin/login");
        return;
      }

      setUser(session.user);

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error || !data) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error in checkAdminStatus:", error);
      navigate("/");
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load products",
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
      imageUrl: product.image_url || "",
      sellerName: product.seller_name || "",
      sellerLocation: product.seller_location || "",
      sellerCountry: product.seller_country || "",
      buyerName: product.buyer_name || "",
      buyerPlace: product.buyer_place || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct) return;

    try {
      const validatedData = productSchema.parse({
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl || undefined,
        sellerName: formData.sellerName || undefined,
        sellerLocation: formData.sellerLocation || undefined,
        sellerCountry: formData.sellerCountry || undefined,
        buyerName: formData.buyerName || undefined,
        buyerPlace: formData.buyerPlace || undefined,
      });

      setLoading(true);

      const { error } = await supabase
        .from("products")
        .update({
          name: validatedData.name,
          description: validatedData.description,
          price: validatedData.price,
          image_url: validatedData.imageUrl,
          seller_name: validatedData.sellerName,
          seller_location: validatedData.sellerLocation,
          seller_country: validatedData.sellerCountry,
          buyer_name: validatedData.buyerName,
          buyer_place: validatedData.buyerPlace,
        })
        .eq("id", editingProduct.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Product updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Product deleted successfully",
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Manage Products</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">View, edit, and delete products</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/admin")} className="text-xs sm:text-sm">
              Add Product
            </Button>
            <Button variant="outline" onClick={() => navigate("/marketplace")} className="text-xs sm:text-sm">
              View Marketplace
            </Button>
            <Button variant="outline" onClick={handleLogout} className="text-xs sm:text-sm">
              Logout
            </Button>
          </div>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No products yet</p>
              <Button onClick={() => navigate("/admin")}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <img
                      src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop"}
                      alt={product.name}
                      className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-base sm:text-lg">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                      )}
                      <p className="text-base sm:text-lg font-bold text-primary mt-2">${product.price.toFixed(2)}</p>
                      {product.seller_name && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                          Seller: {product.seller_name} {product.seller_location && `(${product.seller_location})`}
                        </p>
                      )}
                      {product.buyer_name && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Sold to: {product.buyer_name} {product.buyer_place && `(${product.buyer_place})`}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 self-start sm:self-center">
                      <Dialog open={isEditDialogOpen && editingProduct?.id === product.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                            <DialogDescription>
                              Update product details
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Product Name *</Label>
                              <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-price">Price *</Label>
                              <Input
                                id="edit-price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-imageUrl">Image URL</Label>
                              <Input
                                id="edit-imageUrl"
                                type="url"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-sellerName">Seller Name</Label>
                              <Input
                                id="edit-sellerName"
                                value={formData.sellerName}
                                onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-sellerLocation">Seller Location</Label>
                              <Input
                                id="edit-sellerLocation"
                                value={formData.sellerLocation}
                                onChange={(e) => setFormData({ ...formData, sellerLocation: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-sellerCountry">Seller Country (2-letter code)</Label>
                              <Input
                                id="edit-sellerCountry"
                                value={formData.sellerCountry}
                                onChange={(e) => setFormData({ ...formData, sellerCountry: e.target.value.toUpperCase() })}
                                maxLength={2}
                                placeholder="US"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-buyerName">Buyer Name (if sold)</Label>
                              <Input
                                id="edit-buyerName"
                                value={formData.buyerName}
                                onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-buyerPlace">Buyer Location (if sold)</Label>
                              <Input
                                id="edit-buyerPlace"
                                value={formData.buyerPlace}
                                onChange={(e) => setFormData({ ...formData, buyerPlace: e.target.value })}
                              />
                            </div>

                            <div className="flex gap-2 justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={loading}>
                                {loading ? "Updating..." : "Update Product"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{product.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(product.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

export default AdminProducts;
