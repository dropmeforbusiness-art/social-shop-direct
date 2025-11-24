import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Country {
  id: string;
  code: string;
  name: string;
  currency_code: string;
  currency_symbol: string;
  flag_emoji: string | null;
}

interface CurrencyContextType {
  selectedCountry: Country | null;
  setSelectedCountry: (country: Country) => void;
  exchangeRates: Record<string, number>;
  convertPrice: (price: number, fromCurrency?: string) => { amount: number; symbol: string; code: string };
  countries: Country[];
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCountry, setSelectedCountryState] = useState<Country | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Load countries from database
  useEffect(() => {
    const loadCountries = async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading countries:', error);
      } else if (data) {
        setCountries(data);
        
        // Load saved country preference or default to US
        const savedCountryCode = localStorage.getItem('selectedCountryCode');
        const defaultCountry = data.find(c => c.code === (savedCountryCode || 'US')) || data[0];
        setSelectedCountryState(defaultCountry);
      }
      setLoading(false);
    };

    loadCountries();
  }, []);

  // Fetch exchange rates when component mounts and every hour
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-exchange-rates', {
          body: { baseCurrency: 'USD' }
        });

        if (error) {
          console.error('Error fetching exchange rates:', error);
          // Use fallback rates from error response if available
          if (data?.fallbackRates) {
            setExchangeRates(data.fallbackRates);
          }
        } else if (data?.rates) {
          setExchangeRates(data.rates);
        }
      } catch (err) {
        console.error('Failed to fetch exchange rates:', err);
      }
    };

    fetchExchangeRates();
    
    // Refresh rates every hour
    const interval = setInterval(fetchExchangeRates, 3600000);
    
    return () => clearInterval(interval);
  }, []);

  const setSelectedCountry = (country: Country) => {
    setSelectedCountryState(country);
    localStorage.setItem('selectedCountryCode', country.code);
  };

  const convertPrice = (price: number, fromCurrency: string = 'USD') => {
    if (!selectedCountry) {
      return { amount: price, symbol: '$', code: 'USD' };
    }

    const targetCurrency = selectedCountry.currency_code;
    
    // If same currency, no conversion needed
    if (fromCurrency === targetCurrency) {
      return {
        amount: price,
        symbol: selectedCountry.currency_symbol,
        code: targetCurrency
      };
    }

    // Get exchange rate
    const rate = exchangeRates[targetCurrency] || 1;
    const convertedAmount = price * rate;

    return {
      amount: convertedAmount,
      symbol: selectedCountry.currency_symbol,
      code: targetCurrency
    };
  };

  return (
    <CurrencyContext.Provider
      value={{
        selectedCountry,
        setSelectedCountry,
        exchangeRates,
        convertPrice,
        countries,
        loading
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};