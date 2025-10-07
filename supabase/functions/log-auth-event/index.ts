import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const LogAuthEventSchema = z.object({
  action: z.enum([
    "login_failed",
    "reset_failed",
    "reset_link_invalid",
    "session_timeout",
    "post_reset_session_timeout",
  ]),
  email: z.string().email().optional(),
  reason: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = LogAuthEventSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid payload", details: parsed.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { action, email, reason, meta } = parsed.data;

    // Try to resolve user_id by email if provided
    let userId: string | null = null;
    if (email) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (profile?.id) {
        userId = profile.id;
      }
    }

    const { error: insertError } = await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      user_email: email ?? null,
      action,
      table_name: "auth",
      record_id: email ?? null,
      old_values: null,
      new_values: { reason, meta },
    });

    if (insertError) {
      console.error("Failed to insert auth log:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to write log" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("Unexpected error in log-auth-event:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});