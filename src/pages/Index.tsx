import { Hero } from "@/components/ui/animated-hero";
import { HeroScroll } from "@/components/HeroScroll";
import { QASection } from "@/components/QASection";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground cursor-pointer" onClick={() => navigate("/")}>
              Drop.
            </h1>
            <nav className="flex gap-3 sm:gap-6">
              <Button variant="ghost" size="sm" className="sm:size-default" onClick={() => navigate("/marketplace")}>
                Buy
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <Hero />
      <HeroScroll />
      <QASection />
      <Footer />
    </div>
  );
};

export default Index;
