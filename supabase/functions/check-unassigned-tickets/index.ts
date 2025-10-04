import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Calculate business days between two dates
const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting check for unassigned tickets...");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all open tickets without assigned_to
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select(`
        id,
        title,
        description,
        created_at,
        status,
        priority,
        profiles:created_by (
          full_name,
          email
        )
      `)
      .is("assigned_to", null)
      .in("status", ["open", "in_progress"]);

    if (error) {
      console.error("Error fetching tickets:", error);
      throw error;
    }

    console.log(`Found ${tickets?.length || 0} unassigned tickets`);

    const ticketsToNotify = tickets?.filter((ticket) => {
      const businessDays = calculateBusinessDays(
        new Date(ticket.created_at),
        new Date()
      );
      return businessDays > 2;
    }) || [];

    console.log(`${ticketsToNotify.length} tickets require notification (>2 business days)`);

    if (ticketsToNotify.length > 0) {
      const ticketList = ticketsToNotify
        .map(
          (ticket) =>
            `<li>
              <strong>${ticket.title}</strong><br/>
              Priority: ${ticket.priority}<br/>
              Status: ${ticket.status}<br/>
              Submitted by: ${ticket.profiles?.full_name || ticket.profiles?.email || 'Unknown'}<br/>
              Created: ${new Date(ticket.created_at).toLocaleDateString('nl-NL')}<br/>
              <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com')}/tickets/${ticket.id}">View Ticket</a>
            </li>`
        )
        .join("");

      const emailResponse = await resend.emails.send({
        from: "Lumiforte Helpdesk <onboarding@resend.dev>",
        to: ["jeroen.vrieselaar@lumiforte.com"],
        subject: `⚠️ ${ticketsToNotify.length} Unassigned Ticket(s) Require Attention`,
        html: `
          <h1>Unassigned Tickets Alert</h1>
          <p>The following tickets have been open for more than 2 business days without being assigned:</p>
          <ul style="list-style: none; padding: 0;">
            ${ticketList}
          </ul>
          <p>Please assign these tickets as soon as possible.</p>
          <p>Best regards,<br/>Lumiforte Helpdesk System</p>
        `,
      });

      console.log("Email sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({
          success: true,
          ticketsNotified: ticketsToNotify.length,
          emailResponse,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticketsNotified: 0,
        message: "No tickets require notification",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-unassigned-tickets function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
