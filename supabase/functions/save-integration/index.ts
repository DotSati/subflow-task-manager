import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-GCM encryption helpers (base64 in/out)
const ENC_KEY_B64 = Deno.env.get("INTEGRATIONS_ENC_KEY") || "";

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
function bytesToB64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
async function importAesKey(b64: string): Promise<CryptoKey> {
  const raw = b64ToBytes(b64);
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
async function encryptText(plain: string): Promise<{ cipher: string; iv: string } | null> {
  if (!ENC_KEY_B64 || !plain) return null;
  const key = await importAesKey(ENC_KEY_B64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  return { cipher: bytesToB64(new Uint8Array(enc)), iv: bytesToB64(iv) };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = (body?.action as string) || ""; // "create" | "update"
    const data = body?.data || {};

    if (!["create", "update"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } }
    );

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const userId = authData.user.id;

    // Prepare fields
    const name = (data.name || "").toString();
    const type = (data.type || "").toString();
    const url = (data.url || "").toString() || null;
    const username = (data.username || "").toString() || null;
    const password = (data.password || "").toString();
    const api_key = (data.api_key || "").toString();

    const updates: Record<string, any> = {
      name,
      type,
      url,
      username,
    };

    // Encrypt secrets when provided and key available; otherwise leave as null
    if (password) {
      const res = await encryptText(password);
      if (res) {
        updates.encrypted_password = res.cipher;
        updates.encrypted_password_iv = res.iv;
      }
    }
    if (api_key) {
      const res = await encryptText(api_key);
      if (res) {
        updates.encrypted_api_key = res.cipher;
        updates.encrypted_api_key_iv = res.iv;
      }
    }

    if (action === "create") {
      const { data: inserted, error } = await supabase
        .from("integrations")
        .insert([{ ...updates, user_id: userId }])
        .select("id, user_id, name, type, url, username, created_at, updated_at")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(inserted), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    } else {
      const id = (data.id || data?.integration?.id || "").toString();
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing integration id for update" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }

      const { data: updated, error } = await supabase
        .from("integrations")
        .update(updates)
        .eq("id", id)
        .select("id, user_id, name, type, url, username, created_at, updated_at")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(updated), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
  } catch (e: any) {
    console.error("save-integration error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
