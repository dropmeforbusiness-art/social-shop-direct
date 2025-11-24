import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { baseCurrency = 'USD', targetCurrency } = await req.json();
    
    console.log(`Fetching exchange rates from ${baseCurrency} to ${targetCurrency || 'all currencies'}`);

    // Using exchangerate-api.io (free tier allows 1500 requests/month)
    const apiUrl = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Return specific currency rate or all rates
    const result = targetCurrency 
      ? { 
          base: baseCurrency,
          target: targetCurrency,
          rate: data.rates[targetCurrency],
          lastUpdated: data.date
        }
      : {
          base: baseCurrency,
          rates: data.rates,
          lastUpdated: data.date
        };

    console.log('Exchange rates fetched successfully');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        fallbackRates: {
          // Fallback rates in case API fails
          USD: 1,
          EUR: 0.92,
          GBP: 0.79,
          CAD: 1.36,
          AUD: 1.52,
          INR: 83.12,
          JPY: 149.50,
          CNY: 7.24,
          BRL: 4.97,
          MXN: 17.08,
          AED: 3.67,
          SGD: 1.34,
          HKD: 7.83,
          KRW: 1319.50,
          ZAR: 18.65
        }
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});