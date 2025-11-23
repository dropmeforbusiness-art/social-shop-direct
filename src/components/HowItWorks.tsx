import { Card } from "@/components/ui/card";
import { MessageSquare, Sparkles, Link2, CreditCard } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Customers Inquire",
    description: "Receive product inquiries via WhatsApp or Instagram messages automatically",
  },
  {
    icon: Sparkles,
    title: "AI Generates Listings",
    description: "Our AI creates professional product listings with photos, descriptions, and pricing",
  },
  {
    icon: Link2,
    title: "Share Unique Links",
    description: "Get shareable product links instantly for each listing to send to customers",
  },
  {
    icon: CreditCard,
    title: "Track & Earn",
    description: "Process payments and automatically distribute commissions to all parties",
  },
];

export const HowItWorks = () => {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
          How It Works
        </h2>
        <p className="mb-12 text-lg text-muted-foreground">
          From inquiry to sale in four simple steps
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card
              key={index}
              className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 p-6 transition-all hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="absolute right-4 top-4 text-6xl font-bold text-primary/5">
                {index + 1}
              </div>
              <div className="relative">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
