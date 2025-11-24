import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/contexts/CurrencyContext";

export const CountrySelector = () => {
  const { selectedCountry, setSelectedCountry, countries, loading } = useCurrency();

  if (loading || !selectedCountry) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {selectedCountry.flag_emoji} {selectedCountry.currency_code}
          </span>
          <span className="sm:hidden">{selectedCountry.flag_emoji}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto bg-background z-50">
        <DropdownMenuLabel>Select Country & Currency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {countries.map((country) => (
          <DropdownMenuItem
            key={country.id}
            onClick={() => setSelectedCountry(country)}
            className={selectedCountry.code === country.code ? "bg-accent" : ""}
          >
            <span className="mr-2">{country.flag_emoji}</span>
            <span className="flex-1">{country.name}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {country.currency_code}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};