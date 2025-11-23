import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

// Mock data for demonstration
const mockProducts: Array<{
  id: string;
  title: string;
  price: number;
  image: string;
  status: "available" | "sold";
  source: "whatsapp" | "instagram";
}> = [
  {
    id: "1",
    title: "Premium Wireless Headphones",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    status: "available" as const,
    source: "whatsapp" as const,
  },
  {
    id: "2",
    title: "Designer Leather Backpack",
    price: 189.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    status: "available" as const,
    source: "instagram" as const,
  },
  {
    id: "3",
    title: "Smart Fitness Watch",
    price: 249.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    status: "sold" as const,
    source: "whatsapp" as const,
  },
  {
    id: "4",
    title: "Vintage Film Camera",
    price: 299.99,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop",
    status: "available" as const,
    source: "instagram" as const,
  },
];

export const ProductFeed = () => {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Latest Listings</h2>
          <p className="mt-2 text-muted-foreground">
            Products from social inquiries, ready to share
          </p>
        </div>
        <Button variant="outline">View All</Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
