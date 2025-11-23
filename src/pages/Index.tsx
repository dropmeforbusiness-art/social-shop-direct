import { Hero } from "@/components/ui/animated-hero";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground cursor-pointer" onClick={() => navigate("/")}>
              Drop.
            </h1>
            <nav className="flex gap-6">
              <Button variant="ghost" onClick={() => navigate("/marketplace")}>
                Buy
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <Hero />
    </div>
  );
};

export default Index;
