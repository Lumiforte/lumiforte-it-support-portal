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

const ManageUserSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['ban', 'unban', 'update_name']),
  fullName: z.string().max(100).optional()
});

interface ManageUserRequest {
  userId: string;
  action: 'ban' | 'unban' | 'update_name';
  fullName?: string;
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
    const validation = ManageUserSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { userId, action, fullName }: ManageUserRequest = validation.data;

    console.log(`Managing user ${userId}, action: ${action}`);

    // Check if this is the protected admin account
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (targetUser?.user?.email === 'jeroen.vrieselaar@lumiforte.com') {
      return new Response(
        JSON.stringify({ error: 'Dit account kan niet worden gedeactiveerd (beschermd admin account)' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === 'ban') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: "876000h" // 100 years
      });

      if (error) {
        console.error("Error banning user:", error);
        return new Response(
          JSON.stringify({ error: "Kon gebruiker niet deactiveren" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Log audit entry
      try {
        await supabaseAdmin.rpc('log_audit_entry', {
          p_user_id: user.id,
          p_user_email: user.email,
          p_action: 'deactivated',
          p_table_name: 'users',
          p_record_id: userId,
          p_new_values: { banned: true }
        });
      } catch (logError) {
        console.error("Error logging audit entry:", logError);
      }

      console.log(`User ${userId} banned successfully`);
      return new Response(
        JSON.stringify({ success: true, message: "Gebruiker succesvol gedeactiveerd" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === 'unban') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: "none"
      });

      if (error) {
        console.error("Error unbanning user:", error);
        return new Response(
          JSON.stringify({ error: "Kon gebruiker niet activeren" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Log audit entry
      try {
        await supabaseAdmin.rpc('log_audit_entry', {
          p_user_id: user.id,
          p_user_email: user.email,
          p_action: 'activated',
          p_table_name: 'users',
          p_record_id: userId,
          p_new_values: { banned: false }
        });
      } catch (logError) {
        console.error("Error logging audit entry:", logError);
      }

      console.log(`User ${userId} unbanned successfully`);
      return new Response(
        JSON.stringify({ success: true, message: "Gebruiker succesvol geactiveerd" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === 'update_name') {
      if (!fullName) {
        return new Response(
          JSON.stringify({ error: "Naam is verplicht" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Get old value first
      const { data: oldProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", userId);

      if (error) {
        console.error("Error updating name:", error);
        return new Response(
          JSON.stringify({ error: "Kon naam niet updaten" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Log audit entry
      try {
        await supabaseAdmin.rpc('log_audit_entry', {
          p_user_id: user.id,
          p_user_email: user.email,
          p_action: 'updated',
          p_table_name: 'profiles',
          p_record_id: userId,
          p_old_values: { full_name: oldProfile?.full_name },
          p_new_values: { full_name: fullName }
        });
      } catch (logError) {
        console.error("Error logging audit entry:", logError);
      }

      console.log(`User ${userId} name updated successfully`);
      return new Response(
        JSON.stringify({ success: true, message: "Naam succesvol gewijzigd" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ongeldige actie" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("Unexpected error in manage-user:", err);
    return new Response(
      JSON.stringify({ error: "An error occurred while processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
