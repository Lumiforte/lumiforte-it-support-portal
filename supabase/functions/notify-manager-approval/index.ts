import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId } = await req.json();

    console.log(`Processing approval notification for ticket: ${ticketId}`);

    // Get ticket details with creator info
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("tickets")
      .select(`
        *,
        creator:profiles!created_by (
          full_name,
          email,
          team_id,
          teams (
            name
          )
        )
      `)
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error("Error fetching ticket:", ticketError);
      throw new Error("Ticket not found");
    }

    const creatorTeamId = ticket.creator?.team_id;
    if (!creatorTeamId) {
      console.log("Creator has no team, skipping manager notification");
      return new Response(
        JSON.stringify({ message: "No team assigned to creator" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get all managers in the same team
    const { data: managers, error: managersError } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        user_roles!inner (
          role
        )
      `)
      .eq("team_id", creatorTeamId)
      .eq("user_roles.role", "manager");

    if (managersError) {
      console.error("Error fetching managers:", managersError);
      throw new Error("Failed to fetch managers");
    }

    if (!managers || managers.length === 0) {
      console.log("No managers found for team");
      return new Response(
        JSON.stringify({ message: "No managers in team" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${managers.length} managers to notify`);

    // Send email to each manager
    const emailPromises = managers.map(async (manager) => {
      const emailHtml = `
        <h2>New Approval Request</h2>
        <p>Hello ${manager.full_name || manager.email},</p>
        <p>A new ticket requires your approval:</p>
        <ul>
          <li><strong>Title:</strong> ${ticket.title}</li>
          <li><strong>Category:</strong> ${ticket.category}</li>
          <li><strong>Priority:</strong> ${ticket.priority}</li>
          <li><strong>Submitted by:</strong> ${ticket.creator?.full_name || ticket.creator?.email}</li>
          <li><strong>Team:</strong> ${ticket.creator?.teams?.name || 'N/A'}</li>
        </ul>
        <p><strong>Description:</strong></p>
        <p>${ticket.description}</p>
        <p>Please log in to the portal to approve or reject this request.</p>
        <p><a href="${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Review Request</a></p>
      `;

      try {
        const { data, error } = await resend.emails.send({
          from: "LumiForte Support <onboarding@resend.dev>",
          to: [manager.email],
          subject: `New Approval Request: ${ticket.title}`,
          html: emailHtml,
        });

        if (error) {
          console.error(`Error sending email to ${manager.email}:`, error);
          return { success: false, manager: manager.email, error };
        }

        console.log(`Email sent successfully to ${manager.email}`);
        return { success: true, manager: manager.email, data };
      } catch (error) {
        console.error(`Exception sending email to ${manager.email}:`, error);
        return { success: false, manager: manager.email, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Sent ${successCount}/${managers.length} notification emails`);

    return new Response(
      JSON.stringify({ 
        message: "Notifications sent", 
        sent: successCount,
        total: managers.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-manager-approval:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});