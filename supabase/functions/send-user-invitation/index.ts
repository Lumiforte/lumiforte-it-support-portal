import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
const resend = new Resend(resendApiKey);

const InvitationSchema = z.object({
  userId: z.string().uuid(),
  adminEmail: z.string().email()
});

interface InvitationRequest {
  userId: string;
  adminEmail: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token);

    if (verifyError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has admin role
    const { data: roleCheck } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleCheck) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate input
    const body = await req.json();
    const validation = InvitationSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { userId, adminEmail }: InvitationRequest = validation.data;

    console.log(`Sending invitation to user: ${userId} from admin: ${adminEmail}`);

    // Get user details
    const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !targetUser) {
      console.error("Error fetching user:", userError);
      return new Response(
        JSON.stringify({ error: "Gebruiker niet gevonden" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get admin profile for name
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const adminName = adminProfile?.full_name || adminEmail;

    // Generate password recovery link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: targetUser.user.email!,
      options: {
        redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('https://', 'https://').replace('.supabase.co', '.lovableproject.com')}/auth`
      }
    });

    if (resetError || !resetData) {
      console.error("Error generating reset link:", resetError);
      return new Response(
        JSON.stringify({ error: "Kon uitnodigingslink niet genereren" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: `${adminName} <support@lumiforte.dev>`,
      replyTo: adminEmail,
      to: [targetUser.user.email!],
      subject: "Uitnodiging voor het supportplatform",
      html: `
        <h2>Welkom bij het supportplatform</h2>
        <p>Hallo ${targetUser.user.user_metadata?.full_name || targetUser.user.email},</p>
        <p>${adminName} heeft je uitgenodigd om het supportplatform te gebruiken.</p>
        <p>Klik op de onderstaande knop om je wachtwoord in te stellen en in te loggen:</p>
        <p>
          <a href="${resetData.properties.action_link}" 
             style="background-color: #0066cc; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Wachtwoord instellen
          </a>
        </p>
        <p>Of kopieer deze link naar je browser:</p>
        <p style="color: #666; word-break: break-all;">${resetData.properties.action_link}</p>
        <p>Deze link is 24 uur geldig.</p>
        <br>
        <p>Met vriendelijke groet,<br>${adminName}</p>
      `,
    });

    console.log("Invitation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Uitnodiging succesvol verstuurd"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("Unexpected error in send-user-invitation:", err);
    return new Response(
      JSON.stringify({ error: "Er is een fout opgetreden bij het versturen van de uitnodiging" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
