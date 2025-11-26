import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  imageUrl: z.string().optional(),
  sellerName: z.string().optional(),
  sellerLocation: z.string().optional(),
  sellerCountry: z.string().optional(),
  sellerPhone: z.string().optional(),
  shippingMethod: z.string().optional(),
  sellerAddress: z.string().optional(),
  sellerPincode: z.string().optional(),
  sellerCity: z.string().optional(),
  sellerState: z.string().optional(),
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
  seller_phone: string | null;
  status: string | null;
  shipping_method: string | null;
  seller_address: string | null;
  seller_pincode: string | null;
  seller_city: string | null;
  seller_state: string | null;
}

interface ProductManagementProps {
  userId: string;
}

export const ProductManagement = ({ userId }: ProductManagementProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    sellerName: "",
    sellerLocation: "",
    sellerCountry: "",
    sellerPhone: "",
    shippingMethod: "pickup",
    sellerAddress: "",
    sellerPincode: "",
    sellerCity: "",
    sellerState: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
      return;
    }

    setProducts(data || []);
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
      return null;
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      sellerName: "",
      sellerLocation: "",
      sellerCountry: "",
      sellerPhone: "",
      shippingMethod: "pickup",
      sellerAddress: "",
      sellerPincode: "",
      sellerCity: "",
      sellerState: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const uploadedImageUrl = await uploadImage();
      
      const validatedData = productSchema.parse({
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        imageUrl: uploadedImageUrl || formData.imageUrl || undefined,
        sellerName: formData.sellerName || undefined,
        sellerLocation: formData.sellerLocation || undefined,
        sellerCountry: formData.sellerCountry || undefined,
        sellerPhone: formData.sellerPhone || undefined,
        shippingMethod: formData.shippingMethod || undefined,
        sellerAddress: formData.sellerAddress || undefined,
        sellerPincode: formData.sellerPincode || undefined,
        sellerCity: formData.sellerCity || undefined,
        sellerState: formData.sellerState || undefined,
      });

      if (editingProduct) {
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
            seller_phone: validatedData.sellerPhone,
            shipping_method: validatedData.shippingMethod,
            seller_address: validatedData.sellerAddress,
            seller_pincode: validatedData.sellerPincode,
            seller_city: validatedData.sellerCity,
            seller_state: validatedData.sellerState,
          })
          .eq("id", editingProduct.id);

        if (error) throw error;

        toast({ title: "Success", description: "Product updated" });
      } else {
        const { error } = await supabase.from("products").insert({
          user_id: userId,
          name: validatedData.name,
          description: validatedData.description,
          price: validatedData.price,
          image_url: validatedData.imageUrl,
          seller_name: validatedData.sellerName,
          seller_location: validatedData.sellerLocation,
          seller_country: validatedData.sellerCountry,
          seller_phone: validatedData.sellerPhone,
          shipping_method: validatedData.shippingMethod,
          seller_address: validatedData.sellerAddress,
          seller_pincode: validatedData.sellerPincode,
          seller_city: validatedData.sellerCity,
          seller_state: validatedData.sellerState,
        });

        if (error) throw error;

        toast({ title: "Success", description: "Product added" });
      }

      resetForm();
      setIsDialogOpen(false);
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
      sellerPhone: product.seller_phone || "",
      shippingMethod: product.shipping_method || "pickup",
      sellerAddress: product.seller_address || "",
      sellerPincode: product.seller_pincode || "",
      sellerCity: product.seller_city || "",
      sellerState: product.seller_state || "",
    });
    setImagePreview(product.image_url);
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
    fetchProducts();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Product Management</h2>
          <p className="text-muted-foreground">Add, edit, and remove products</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
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
                <Label htmlFor="imageUpload">Product Image</Label>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
                {imagePreview && (
                  <div className="mt-2 relative inline-block">
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
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="imageUrl">Or Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sellerName">Seller Name</Label>
                  <Input
                    id="sellerName"
                    value={formData.sellerName}
                    onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sellerLocation">Seller Location</Label>
                  <Input
                    id="sellerLocation"
                    value={formData.sellerLocation}
                    onChange={(e) => setFormData({ ...formData, sellerLocation: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sellerCountry">Seller Country (2-letter code)</Label>
                  <Input
                    id="sellerCountry"
                    value={formData.sellerCountry}
                    onChange={(e) => setFormData({ ...formData, sellerCountry: e.target.value.toUpperCase() })}
                    maxLength={2}
                    placeholder="US"
                  />
                </div>
                <div>
                  <Label htmlFor="sellerPhone">Seller Phone</Label>
                  <Input
                    id="sellerPhone"
                    type="tel"
                    value={formData.sellerPhone}
                    onChange={(e) => setFormData({ ...formData, sellerPhone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="shippingMethod">Shipping Method *</Label>
                <Select value={formData.shippingMethod} onValueChange={(value) => setFormData({ ...formData, shippingMethod: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shipping method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup from Seller</SelectItem>
                    <SelectItem value="shiprocket">Deliver via Shiprocket</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.shippingMethod === "shiprocket" && (
                <>
                  <div>
                    <Label htmlFor="sellerAddress">Seller Address *</Label>
                    <Textarea
                      id="sellerAddress"
                      value={formData.sellerAddress}
                      onChange={(e) => setFormData({ ...formData, sellerAddress: e.target.value })}
                      placeholder="Full address for pickup"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sellerCity">City *</Label>
                      <Input
                        id="sellerCity"
                        value={formData.sellerCity}
                        onChange={(e) => setFormData({ ...formData, sellerCity: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sellerState">State *</Label>
                      <Input
                        id="sellerState"
                        value={formData.sellerState}
                        onChange={(e) => setFormData({ ...formData, sellerState: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sellerPincode">Pincode *</Label>
                    <Input
                      id="sellerPincode"
                      value={formData.sellerPincode}
                      onChange={(e) => setFormData({ ...formData, sellerPincode: e.target.value })}
                      placeholder="110001"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Saving..." : editingProduct ? "Update Product" : "Add Product"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
              <p className="text-xl font-bold mb-3">${product.price}</p>
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

      {products.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No products yet. Add your first product!</p>
        </Card>
      )}
    </div>
  );
};
