import { Hero } from "@/components/ui/animated-hero";
import { ProductFeed } from "@/components/ProductFeed";
import { HowItWorks } from "@/components/HowItWorks";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <HowItWorks />
      <ProductFeed />
    </div>
  );
};

export default Index;
