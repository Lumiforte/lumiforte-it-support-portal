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

    // Generate a password recovery (reset) link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: redirect },
    });
    if (error) {
      console.error("generateLink error", error);
      throw error;
    }
    // Prefer the action_link provided by the API
    const actionLink =
      (data as any)?.properties?.action_link ??
      (data as any)?.action_link ??
      null;
    if (!actionLink) {
      console.log("generateLink data without action_link", data);
      throw new Error("Failed to generate reset link");
    }
    const result = await resend.emails.send({
      from: "Lumiforte Support <onboarding@resend.dev>",
      to: [email],
      subject: "Reset your password",
      html: `
        <h2>Reset your password</h2>
        <p>Click the button below to reset your password.</p>
        <p><a href="${actionLink}" style="display:inline-block;padding:10px 14px;background:#0a66c2;color:#fff;text-decoration:none;border-radius:6px">Reset password</a></p>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p><a href="${actionLink}">${actionLink}</a></p>
      `,
    });

    return new Response(
      JSON.stringify({ sent: true, id: (result as any)?.id ?? null }),
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
