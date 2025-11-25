import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const countryCodes = [
  { code: "+971", country: "🇦🇪 UAE", flag: "🇦🇪" },
  { code: "+1", country: "🇺🇸 USA", flag: "🇺🇸" },
  { code: "+44", country: "🇬🇧 UK", flag: "🇬🇧" },
  { code: "+91", country: "🇮🇳 India", flag: "🇮🇳" },
  { code: "+61", country: "🇦🇺 Australia", flag: "🇦🇺" },
  { code: "+81", country: "🇯🇵 Japan", flag: "🇯🇵" },
  { code: "+86", country: "🇨🇳 China", flag: "🇨🇳" },
  { code: "+49", country: "🇩🇪 Germany", flag: "🇩🇪" },
  { code: "+33", country: "🇫🇷 France", flag: "🇫🇷" },
  { code: "+39", country: "🇮🇹 Italy", flag: "🇮🇹" },
  { code: "+34", country: "🇪🇸 Spain", flag: "🇪🇸" },
  { code: "+7", country: "🇷🇺 Russia", flag: "🇷🇺" },
  { code: "+55", country: "🇧🇷 Brazil", flag: "🇧🇷" },
  { code: "+27", country: "🇿🇦 South Africa", flag: "🇿🇦" },
  { code: "+20", country: "🇪🇬 Egypt", flag: "🇪🇬" },
  { code: "+966", country: "🇸🇦 Saudi Arabia", flag: "🇸🇦" },
  { code: "+974", country: "🇶🇦 Qatar", flag: "🇶🇦" },
  { code: "+965", country: "🇰🇼 Kuwait", flag: "🇰🇼" },
  { code: "+973", country: "🇧🇭 Bahrain", flag: "🇧🇭" },
  { code: "+968", country: "🇴🇲 Oman", flag: "🇴🇲" },
];

interface PhoneInputProps {
  label?: string;
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneNumberChange: (number: string) => void;
  required?: boolean;
  id?: string;
}

export const PhoneInput = ({
  label = "Phone Number",
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  required = false,
  id = "phone",
}: PhoneInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Select value={countryCode} onValueChange={onCountryCodeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Code" />
          </SelectTrigger>
          <SelectContent>
            {countryCodes.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          type="tel"
          placeholder="123456789"
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          required={required}
          className="flex-1"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Full number: {countryCode}{phoneNumber}
      </p>
    </div>
  );
};
