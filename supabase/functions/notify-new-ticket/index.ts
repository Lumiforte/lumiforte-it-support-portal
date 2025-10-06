import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NotifyTicketSchema = z.object({
  ticketId: z.string().uuid(),
  title: z.string().max(200),
  description: z.string().max(5000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string().max(100),
  userName: z.string().max(100),
  userEmail: z.string().email().max(254)
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface NotifyTicketRequest {
  ticketId: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  userName: string;
  userEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const body = await req.json();
    const validation = NotifyTicketSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { ticketId, title, description, priority, category, userName, userEmail }: NotifyTicketRequest = validation.data;

    console.log("Sending notification for new ticket:", ticketId);

    const priorityColor = {
      low: "#10b981",
      medium: "#f59e0b",
      high: "#ef4444",
      urgent: "#dc2626"
    }[priority] || "#6b7280";

    const emailResponse = await resend.emails.send({
      from: "Lumiforte Support <support@lumiforte.dev>",
      to: ["jeroen.vrieselaar@lumiforte.com"],
      subject: `Nieuw Support Ticket: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e40af;">Nieuw Support Ticket Aangemaakt</h1>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1f2937;">Ticket Details</h2>
            <p><strong>Ticket ID:</strong> ${escapeHtml(ticketId)}</p>
            <p><strong>Titel:</strong> ${escapeHtml(title)}</p>
            <p><strong>Categorie:</strong> ${escapeHtml(category || "Niet gespecificeerd")}</p>
            <p><strong>Prioriteit:</strong> <span style="color: ${priorityColor}; font-weight: bold;">${escapeHtml(priority.toUpperCase())}</span></p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #1f2937;">Beschrijving:</h3>
            <p style="white-space: pre-wrap;">${escapeHtml(description)}</p>
          </div>
          
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Aangemaakt door:</h3>
            <p><strong>Naam:</strong> ${escapeHtml(userName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(userEmail)}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Dit is een geautomatiseerde notificatie van het Lumiforte Support Systeem.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in notify-new-ticket function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred while processing your request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
