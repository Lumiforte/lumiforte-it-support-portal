import { supabase } from "@/integrations/supabase/client";

export type AuthEventAction =
  | "login_failed"
  | "reset_failed"
  | "reset_link_invalid"
  | "session_timeout"
  | "post_reset_session_timeout";

export async function logAuthEvent(params: {
  action: AuthEventAction;
  email?: string;
  reason?: string;
  meta?: Record<string, any>;
}) {
  try {
    await supabase.functions.invoke("log-auth-event", {
      body: params,
    });
  } catch (e) {
    // Best-effort logging; ignore failures
    console.warn("logAuthEvent failed", e);
  }
}
