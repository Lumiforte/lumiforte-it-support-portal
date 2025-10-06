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

const UpdateEmailSchema = z.object({
  oldEmail: z.string().email().max(254),
  newEmail: z.string().email().max(254)
});

interface UpdateEmailRequest {
  oldEmail: string;
  newEmail: string;
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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
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
    const validation = UpdateEmailSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { oldEmail, newEmail }: UpdateEmailRequest = validation.data;

    console.log(`Attempting to update email from ${oldEmail} to ${newEmail}`);

    // Find user by old email
    const { data: users, error: findError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (findError) {
      console.error("Error finding users:", findError);
      return new Response(
        JSON.stringify({ error: "Kon gebruikers niet ophalen" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const targetUser = users.users.find(u => u.email === oldEmail);
    
    if (!targetUser) {
      console.error(`User with email ${oldEmail} not found`);
      return new Response(
        JSON.stringify({ error: "Gebruiker niet gevonden" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found user with ID: ${targetUser.id}`);

    // Update email in auth.users via admin API
    const { data: updatedUser, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { email: newEmail }
    );

    if (updateAuthError) {
      console.error("Error updating auth email:", updateAuthError);
      return new Response(
        JSON.stringify({ error: "Kon email niet updaten" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Updated auth email for user ${targetUser.id}`);

    // Update email in profiles table
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({ email: newEmail })
      .eq("id", targetUser.id);

    if (updateProfileError) {
      console.error("Error updating profile email:", updateProfileError);
      return new Response(
        JSON.stringify({ error: "Kon email niet updaten" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Successfully updated email from ${oldEmail} to ${newEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email succesvol gewijzigd van ${oldEmail} naar ${newEmail}`,
        userId: targetUser.id
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("Unexpected error in update-user-email:", err);
    return new Response(
      JSON.stringify({ error: "An error occurred while processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
