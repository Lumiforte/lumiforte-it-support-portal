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

const DeleteUserSchema = z.object({
  userId: z.string().uuid()
});

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
    const validation = DeleteUserSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { userId } = validation.data;

    console.log(`Checking if user ${userId} can be deleted...`);

    // Check if this is a protected admin account
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const protectedEmails = ['jeroen.vrieselaar@lumiforte.com', 'jort.gerritsen@lumiforte.com'];
    if (protectedEmails.includes(targetUser?.user?.email || '')) {
      return new Response(
        JSON.stringify({ error: 'This account cannot be deleted (protected admin account)' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Checking if user ${userId} has any tickets...`);

    // Check if user has created any tickets
    const { data: createdTickets, error: createdTicketsError } = await supabaseAdmin
      .from('tickets')
      .select('id, title, status')
      .eq('created_by', userId)
      .in('status', ['open', 'in_progress']);

    if (createdTicketsError) {
      console.error("Error checking created tickets:", createdTicketsError);
      return new Response(
        JSON.stringify({ error: "Failed to check user's created tickets" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is assigned to any tickets
    const { data: assignedTickets, error: assignedTicketsError } = await supabaseAdmin
      .from('tickets')
      .select('id, title, status')
      .eq('assigned_to', userId)
      .in('status', ['open', 'in_progress']);

    if (assignedTicketsError) {
      console.error("Error checking assigned tickets:", assignedTicketsError);
      return new Response(
        JSON.stringify({ error: "Failed to check user's assigned tickets" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const totalCreated = createdTickets?.length || 0;
    const totalAssigned = assignedTickets?.length || 0;

    if (totalCreated > 0 || totalAssigned > 0) {
      console.log(`User ${userId} has ${totalCreated} active created tickets and ${totalAssigned} active assigned tickets, cannot delete`);
      
      let errorMessage = "This user cannot be deleted: ";
      const reasons = [] as string[];
      
      if (totalCreated > 0) {
        reasons.push(`${totalCreated} ${totalCreated === 1 ? 'active created ticket' : 'active created tickets'}`);
      }
      if (totalAssigned > 0) {
        reasons.push(`${totalAssigned} ${totalAssigned === 1 ? 'active assigned ticket' : 'active assigned tickets'}`);
      }
      
      errorMessage += reasons.join(" and ");
      errorMessage += ". Close or reassign these tickets first.";
      
      // Business-rule block: return 200 with structured response so UI can show a friendly message
      return new Response(
        JSON.stringify({ 
          success: false,
          canDelete: false,
          error: errorMessage,
          details: {
            activeCreatedTickets: totalCreated,
            activeAssignedTickets: totalAssigned
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // No tickets found, proceed with deletion
    console.log(`User ${userId} has no tickets, proceeding with deletion...`);

    // Delete user from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`User ${userId} deleted successfully`);
    return new Response(
      JSON.stringify({ success: true, message: "User deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("Unexpected error in delete-user:", err);
    return new Response(
      JSON.stringify({ error: "An error occurred while processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
