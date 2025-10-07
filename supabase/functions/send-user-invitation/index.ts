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
        JSON.stringify({ error: "User not found" }),
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
        redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('https://', 'https://').replace('.supabase.co', '.lovableproject.com')}/set-password`
      }
    });

    if (resetError || !resetData) {
      console.error("Error generating reset link:", resetError);
      return new Response(
        JSON.stringify({ error: "Could not generate invitation link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const recoveryLink = resetData;

    // Update invitation_sent_at timestamp
    console.log(`Updating invitation_sent_at for user ${userId}`);
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ invitation_sent_at: new Date().toISOString() })
      .eq("id", userId)
      .select();

    if (updateError) {
      console.error("Error updating invitation timestamp:", updateError);
    } else {
      console.log("Successfully updated invitation timestamp:", updateData);
    }

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: `${adminName} <support@lumiforte.dev>`,
      replyTo: adminEmail,
      to: [targetUser.user.email!],
      subject: "Invitation to the support platform",
      html: `
        <h2>Welcome to the support platform</h2>
        <p>Hello ${targetUser.user.user_metadata?.full_name || targetUser.user.email},</p>
        <p>${adminName} has invited you to use the support platform.</p>
        <p>Click the button below to set your password and log in:</p>
        <p>
          <a href="${recoveryLink.properties.action_link}" 
             style="background-color: #0066cc; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Set password
          </a>
        </p>
        <p>Or copy this link to your browser:</p>
        <p style="color: #666; word-break: break-all;">${recoveryLink.properties.action_link}</p>
        <p>This link is valid for 24 hours.</p>
        <br>
        <p>Best regards,<br>${adminName}</p>
      `,
    });

    console.log("Invitation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("Unexpected error in send-user-invitation:", err);
    return new Response(
      JSON.stringify({ error: "An error occurred while sending the invitation" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
