import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing chat request with messages:', messages.length);

    // Build the AI request with system prompt
    const aiMessages = [
      {
        role: "system",
        content: `You are a helpful product listing assistant for Flip marketplace. Your job is to help sellers create product listings through a conversational flow.

Follow this flow:
1. If an image is provided, analyze it and describe what you see
2. Ask the seller to confirm or provide additional details about the product
3. Ask for the product name if not clear
4. Ask for their willing price (in USD)
5. Ask for their location (city, country)
6. Ask for their name
7. Generate a compelling product description based on the image and conversation
8. Confirm all details before finalizing

Be friendly, concise, and guide them through each step. Once you have all information (name, location, price, product_name, description), respond with a JSON object in this EXACT format:
{
  "ready": true,
  "seller_name": "John Doe",
  "seller_location": "New York, USA",
  "product_name": "Product Name",
  "product_description": "Detailed description...",
  "price": 50
}

If you don't have all the information yet, just continue the conversation naturally without the JSON.`
      },
      ...messages
    ];

    // Add image to the first user message if provided
    if (imageUrl && messages.length > 0) {
      const firstUserMsgIndex = aiMessages.findIndex(m => m.role === 'user');
      if (firstUserMsgIndex > 0) {
        aiMessages[firstUserMsgIndex] = {
          role: "user",
          content: [
            {
              type: "text",
              text: messages[firstUserMsgIndex - 1].content
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        };
      }
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Service temporarily unavailable. Please contact support.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response received');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in product-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});