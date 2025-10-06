import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing AI chat request for message:", message);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Je bent een behulpzame AI-assistent voor het Lumiforte supportplatform. 
            Je helpt gebruikers met vragen over het platform en geeft duidelijke, vriendelijke antwoorden in het Nederlands.
            
            Belangrijke informatie over het platform:
            - Het platform is bedoeld voor interne support en ticketbeheer
            - Gebruikers kunnen tickets aanmaken, bekijken en beheren
            - Er zijn verschillende rollen: admin, helpdesk, HR en user
            - Admins kunnen gebruikers beheren en alle tickets zien
            - Helpdesk medewerkers kunnen tickets beheren en beantwoorden
            - Gebruikers kunnen hun eigen tickets bekijken en aanmaken
            
            Als je iets niet zeker weet, geef dat eerlijk toe en adviseer de gebruiker om contact op te nemen met een admin.`
          },
          {
            role: "user",
            content: message
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit bereikt, probeer het later opnieuw." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Betaling vereist, voeg credits toe aan je Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log("AI response generated successfully");

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in ai-chat function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Er is een fout opgetreden" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
