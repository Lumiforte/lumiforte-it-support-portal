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

    // Generate a password recovery (reset) link using admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: redirect },
    });

    if (error) {
      const status = (error as any)?.status || 500;
      console.error("generateLink error", { status, message: error.message });
      return new Response(
        JSON.stringify({ error: error.message }),
        { status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const actionLink = (data as any)?.properties?.action_link || (data as any)?.action_link || null;
    if (!actionLink) {
      console.error("No action_link in generateLink response", data);
      return new Response(
        JSON.stringify({ error: "Kon geen resetlink genereren" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send via Resend. Avoid clickable anchor to reduce email scanners auto-opening the link
    const textBody = `Reset je wachtwoord:\n\nKopieer en plak deze link in je browser (klik niet rechtstreeks):\n${actionLink}\n\nDe link is eenmalig geldig.`;

    await resend.emails.send({
      from: "Lumiforte Support <noreply@lumiforte.dev>",
      to: [email],
      subject: "Reset your password",
      text: textBody,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2>Reset je wachtwoord</h2>
          <p>Kopieer en plak onderstaande link in je browser (klik niet rechtstreeks). De link is eenmalig geldig.</p>
          <pre style="white-space:pre-wrap;word-break:break-all;background:#f8fafc;padding:12px;border-radius:8px">${actionLink}</pre>
          <p>Werkt het niet? Vraag via het formulier opnieuw een link aan.</p>
        </div>
      `,
    });

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
