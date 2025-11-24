import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { User } from "@supabase/supabase-js";

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

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

      if (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      if (!data) {
        setIsAdmin(false);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.imageUrl || null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-submissions')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-submissions')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isAdmin) {
      toast({
        title: "Error",
        description: "You must be an admin to add products",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Upload image first if there's a file
      const uploadedImageUrl = await uploadImage();
      if (imageFile && !uploadedImageUrl) {
        throw new Error("Failed to upload image");
      }
      const validatedData = productSchema.parse({
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        imageUrl: uploadedImageUrl || formData.imageUrl || undefined,
        sellerName: formData.sellerName || undefined,
        sellerLocation: formData.sellerLocation || undefined,
        sellerCountry: formData.sellerCountry || undefined,
        buyerName: formData.buyerName || undefined,
        buyerPlace: formData.buyerPlace || undefined,
      });

      const { error } = await supabase.from("products").insert({
        user_id: user.id,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        image_url: validatedData.imageUrl,
        seller_name: validatedData.sellerName,
        seller_location: validatedData.sellerLocation,
        seller_country: validatedData.sellerCountry,
        buyer_name: validatedData.buyerName,
        buyer_place: validatedData.buyerPlace,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Product added to marketplace",
      });

      setFormData({
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
      setImageFile(null);
      setImagePreview(null);
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
      <div className="container mx-auto max-w-2xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage marketplace products</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/submissions")} className="text-xs sm:text-sm">
              View Submissions
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/products")} className="text-xs sm:text-sm">
              Manage Products
            </Button>
            <Button variant="outline" onClick={() => navigate("/marketplace")} className="text-xs sm:text-sm">
              View Marketplace
            </Button>
            <Button variant="outline" onClick={handleLogout} className="text-xs sm:text-sm">
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
            <CardDescription>
              List a new product on the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="imageUpload">Product Image</Label>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload an image or leave empty if you prefer to use a URL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Or Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerName">Seller Name</Label>
                <Input
                  id="sellerName"
                  value={formData.sellerName}
                  onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerLocation">Seller Location</Label>
                <Input
                  id="sellerLocation"
                  value={formData.sellerLocation}
                  onChange={(e) => setFormData({ ...formData, sellerLocation: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerCountry">Seller Country (2-letter code, e.g. US, GB)</Label>
                <Input
                  id="sellerCountry"
                  value={formData.sellerCountry}
                  onChange={(e) => setFormData({ ...formData, sellerCountry: e.target.value.toUpperCase() })}
                  maxLength={2}
                  placeholder="US"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyerName">Buyer Name (if sold)</Label>
                <Input
                  id="buyerName"
                  value={formData.buyerName}
                  onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyerPlace">Buyer Location (if sold)</Label>
                <Input
                  id="buyerPlace"
                  value={formData.buyerPlace}
                  onChange={(e) => setFormData({ ...formData, buyerPlace: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding Product..." : "Add Product"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
