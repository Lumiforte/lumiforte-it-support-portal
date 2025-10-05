import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

interface CreateUserRequest {
  email: string;
  password: string;
  fullName?: string;
  roles?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, fullName, roles }: CreateUserRequest = await req.json();

    console.log(`Creating user with email: ${email}`);

    // Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || email }
    });

    if (authError) {
      console.error("Error creating user:", authError);
      return new Response(
        JSON.stringify({ error: "Kon gebruiker niet aanmaken: " + authError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = authData.user.id;
    console.log(`User created with ID: ${userId}`);

    // Update profile with full name if provided
    if (fullName) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }
    }

    // Assign roles if provided
    if (roles && roles.length > 0) {
      const roleInserts = roles.map(role => ({
        user_id: userId,
        role: role
      }));

      const { error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .insert(roleInserts);

      if (rolesError) {
        console.error("Error assigning roles:", rolesError);
      }
    }

    console.log(`User ${userId} created successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Gebruiker succesvol aangemaakt",
        userId
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("Unexpected error in create-user:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
