import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      throw new Error("Invalid token");
    }

    // Check if user is admin
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Get all users from profiles with roles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select(`
        *,
        user_roles (
          id,
          role
        )
      `)
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    // Get auth data for all users
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) throw authError;

    // Combine profile data with auth data
    const usersWithAuthData = profiles?.map(profile => {
      const authUser = authUsers.find(au => au.id === profile.id);
      return {
        ...profile,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        invitation_sent_at: profile.invitation_sent_at || null,
      };
    }) || [];

    return new Response(
      JSON.stringify({ users: usersWithAuthData }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
