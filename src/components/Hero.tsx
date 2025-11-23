import { Button } from "@/components/ui/button";
import { MessageCircle, Instagram } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <MessageCircle className="h-4 w-4" />
            AI-Powered Social Commerce
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Turn Social Messages Into
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Sales </span>
          </h1>
          
          <p className="mb-10 text-lg text-muted-foreground md:text-xl">
            Automatically collect inquiries from WhatsApp and Instagram, generate product listings with AI, 
            and close sales—all with unique shareable links and smart commission tracking.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="group gap-2 text-base">
              Get Started
              <MessageCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-base">
              <Instagram className="h-5 w-5" />
              Learn More
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary md:text-4xl">AI-Powered</div>
              <div className="mt-2 text-sm text-muted-foreground">Auto messaging</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary md:text-4xl">Instant</div>
              <div className="mt-2 text-sm text-muted-foreground">Product links</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary md:text-4xl">Smart</div>
              <div className="mt-2 text-sm text-muted-foreground">Commissions</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
