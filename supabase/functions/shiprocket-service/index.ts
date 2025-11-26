import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShiprocketAuthResponse {
  token: string;
}

interface CreateOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
  }>;
  payment_method: string;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

async function getShiprocketToken(): Promise<string> {
  const email = Deno.env.get('SHIPROCKET_EMAIL');
  const password = Deno.env.get('SHIPROCKET_PASSWORD');

  if (!email || !password) {
    throw new Error('Shiprocket credentials not configured');
  }

  const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate with Shiprocket');
  }

  const data: ShiprocketAuthResponse = await response.json();
  return data.token;
}

async function createShiprocketOrder(token: string, orderData: CreateOrderPayload) {
  const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Shiprocket order creation failed:', errorText);
    throw new Error('Failed to create Shiprocket order');
  }

  return await response.json();
}

async function checkServiceability(token: string, pickupPincode: string, deliveryPincode: string, weight: number, cod: number) {
  const url = new URL('https://apiv2.shiprocket.in/v1/external/courier/serviceability/');
  url.searchParams.append('pickup_postcode', pickupPincode);
  url.searchParams.append('delivery_postcode', deliveryPincode);
  url.searchParams.append('weight', weight.toString());
  url.searchParams.append('cod', cod.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check serviceability');
  }

  return await response.json();
}

async function trackShipment(token: string, awbCode: string) {
  const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awbCode}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to track shipment');
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...payload } = await req.json();

    console.log('Shiprocket service action:', action);

    const token = await getShiprocketToken();

    let result;

    switch (action) {
      case 'create_order':
        result = await createShiprocketOrder(token, payload.orderData);
        break;

      case 'check_serviceability':
        result = await checkServiceability(
          token,
          payload.pickupPincode,
          payload.deliveryPincode,
          payload.weight,
          payload.cod
        );
        break;

      case 'track_shipment':
        result = await trackShipment(token, payload.awbCode);
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Shiprocket service error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
