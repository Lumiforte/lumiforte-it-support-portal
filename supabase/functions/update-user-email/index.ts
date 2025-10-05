import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

interface UpdateEmailRequest {
  oldEmail: string;
  newEmail: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { oldEmail, newEmail }: UpdateEmailRequest = await req.json();

    console.log(`Attempting to update email from ${oldEmail} to ${newEmail}`);

    // Find user by old email
    const { data: users, error: findError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (findError) {
      console.error("Error finding users:", findError);
      return new Response(
        JSON.stringify({ error: "Could not find users" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const user = users.users.find(u => u.email === oldEmail);
    
    if (!user) {
      console.error(`User with email ${oldEmail} not found`);
      return new Response(
        JSON.stringify({ error: `Gebruiker met email ${oldEmail} niet gevonden` }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found user with ID: ${user.id}`);

    // Update email in auth.users via admin API
    const { data: updatedUser, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email: newEmail }
    );

    if (updateAuthError) {
      console.error("Error updating auth email:", updateAuthError);
      return new Response(
        JSON.stringify({ error: "Kon email in auth systeem niet updaten" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Updated auth email for user ${user.id}`);

    // Update email in profiles table
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({ email: newEmail })
      .eq("id", user.id);

    if (updateProfileError) {
      console.error("Error updating profile email:", updateProfileError);
      return new Response(
        JSON.stringify({ error: "Kon email in profiel niet updaten" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Successfully updated email from ${oldEmail} to ${newEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email succesvol gewijzigd van ${oldEmail} naar ${newEmail}`,
        userId: user.id
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("Unexpected error in update-user-email:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
