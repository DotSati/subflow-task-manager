import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description = '' } = await req.json();

    if (!title || typeof title !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing required field: title' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') || '' },
        },
      }
    );

    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'kanbandot')
      .single();

    if (intError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Kanbandot integration not configured for this user.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const webhookUrl = (integration.url || '').toString().trim();
    const username = (integration.username || '').toString().trim();

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'Kanbandot webhook URL is missing in the integration.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const payload = {
      body: {
        user: username || 'unknown',
        title,
        description: description || '',
      },
    };

    console.log('Sending request to Kanbandot webhook:', { webhookUrl, user: username });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log('Kanbandot response:', { status: response.status, body: text });

    if (!response.ok) {
      console.error('Kanbandot HTTP error:', response.status, text);
      return new Response(
        JSON.stringify({ error: `Kanbandot HTTP ${response.status}: ${text}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let json: any = null;
    try { 
      json = JSON.parse(text); 
    } catch {
      // Response might not be JSON, that's okay
      json = { message: text };
    }

    console.log('Successfully sent to Kanbandot:', json);

    return new Response(
      JSON.stringify({ success: true, result: json }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e: any) {
    console.error('Edge function error:', e);
    return new Response(
      JSON.stringify({ error: e?.message || 'Unexpected error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
