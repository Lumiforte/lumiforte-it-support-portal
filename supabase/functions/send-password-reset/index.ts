import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
const resend = new Resend(resendApiKey);

interface ResetRequest { email: string; redirectTo?: string }

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const origin = req.headers.get("origin") ?? "";
    const { email, redirectTo }: ResetRequest = await req.json();

    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const redirect = redirectTo || `${origin}/auth`;

    // Use resetPasswordForEmail instead of admin.generateLink for more reliable tokens
    const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: redirect,
    });
    
    if (error) {
      console.error("resetPasswordForEmail error", error);
      throw error;
    }

    console.log("Password reset email sent via Supabase to:", email);

    // Supabase now sends the email directly - we just return success
    return new Response(
      JSON.stringify({ sent: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("send-password-reset error", err);
    return new Response(JSON.stringify({ error: err.message } ), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
