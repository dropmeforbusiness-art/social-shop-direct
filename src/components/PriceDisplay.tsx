import { useCurrency } from "@/contexts/CurrencyContext";

interface PriceDisplayProps {
  price: number;
  currency?: string;
  className?: string;
  showOriginal?: boolean;
}

export const PriceDisplay = ({ 
  price, 
  currency = 'USD', 
  className = "",
  showOriginal = false 
}: PriceDisplayProps) => {
  const { convertPrice, selectedCountry } = useCurrency();
  
  const converted = convertPrice(price, currency);
  const isConverted = currency !== converted.code;

  return (
    <div className={className}>
      <span className="font-bold">
        {converted.symbol}{converted.amount.toFixed(2)} {converted.code}
      </span>
      {isConverted && showOriginal && (
        <span className="text-xs text-muted-foreground ml-2">
          (${price.toFixed(2)} USD)
        </span>
      )}
    </div>
  );
};