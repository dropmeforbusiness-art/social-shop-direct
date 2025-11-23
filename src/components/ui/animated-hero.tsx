import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["amazing", "new", "wonderful", "beautiful", "smart"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex gap-6 sm:gap-8 py-12 sm:py-20 lg:py-40 items-center justify-center flex-col">
          <div>
            <Button variant="secondary" size="sm" className="gap-2 sm:gap-4 text-xs sm:text-sm" onClick={() => navigate('/marketplace')}>
              Go to Marketplace <MoveRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
          <div className="flex gap-3 sm:gap-4 flex-col">
            <h1 className="text-3xl sm:text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular px-4">
              <span className="text-spektr-cyan-50">This is something</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center pb-2 pt-1 sm:md:pb-4 sm:md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-sm sm:text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center px-4">
              Drop is for everyone - students, families, side-hustlers, collectors, and casual sellers. Send us a message with what you're selling, and we'll handle the rest. Listings in seconds, buyers in minutes, no stress at all.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4">
            <Button size="sm" className="gap-2 sm:gap-4 w-full sm:w-auto sm:size-lg text-xs sm:text-base" variant="outline">
              Sell via WhatsApp <PhoneCall className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button size="sm" className="gap-2 sm:gap-4 w-full sm:w-auto sm:size-lg text-xs sm:text-base">
              Sell via Instagram <MoveRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
