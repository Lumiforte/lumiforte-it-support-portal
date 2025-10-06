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

const CreateUserSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128).optional(),
  fullName: z.string().max(100).optional(),
  roles: z.array(z.enum(['admin', 'helpdesk', 'user'])).optional()
});

interface CreateUserRequest {
  email: string;
  password?: string;
  fullName?: string;
  roles?: string[];
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
    const validation = CreateUserSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, password, fullName, roles }: CreateUserRequest = validation.data;

    console.log(`Creating user with email: ${email}`);

    // Generate a random password if none provided
    const userPassword = password || crypto.randomUUID();

    // Create user in auth.users
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName || email }
    });

    if (createError || !authData?.user) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: "Kon gebruiker niet aanmaken" }),
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
      JSON.stringify({ error: "An error occurred while processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
