import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

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
    const { userId, action, fullName }: ManageUserRequest = await req.json();

    console.log(`Managing user ${userId}, action: ${action}`);

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
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
