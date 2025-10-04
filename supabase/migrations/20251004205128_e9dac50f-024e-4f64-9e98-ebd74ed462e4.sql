-- Create ticket_activities table for logging all ticket actions
CREATE TABLE IF NOT EXISTS public.ticket_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ticket_activities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view activities for tickets they have access to
CREATE POLICY "Users can view activities for their tickets"
ON public.ticket_activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.tickets
    WHERE tickets.id = ticket_activities.ticket_id
    AND (
      tickets.created_by = auth.uid()
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'helpdesk')
    )
  )
);

-- Function to log ticket activities
CREATE OR REPLACE FUNCTION public.log_ticket_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log ticket creation
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action_type, new_value)
    VALUES (NEW.id, NEW.created_by, 'created', NULL);
    RETURN NEW;
  END IF;

  -- Log status changes
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status::text, NEW.status::text);
  END IF;

  -- Log assignment changes
  IF (TG_OP = 'UPDATE' AND (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to)) THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action_type, old_value, new_value)
    VALUES (
      NEW.id, 
      auth.uid(), 
      'assigned', 
      OLD.assigned_to::text, 
      NEW.assigned_to::text
    );
  END IF;

  -- Log priority changes
  IF (TG_OP = 'UPDATE' AND OLD.priority != NEW.priority) THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'priority_changed', OLD.priority::text, NEW.priority::text);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for ticket activities
DROP TRIGGER IF EXISTS ticket_activity_logger ON public.tickets;
CREATE TRIGGER ticket_activity_logger
AFTER INSERT OR UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.log_ticket_activity();

-- Function to log message activities
CREATE OR REPLACE FUNCTION public.log_message_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action_type, new_value)
    VALUES (
      NEW.ticket_id, 
      NEW.created_by, 
      CASE 
        WHEN NEW.is_admin_reply THEN 'replied_helpdesk'
        ELSE 'replied_user'
      END,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for message activities
DROP TRIGGER IF EXISTS message_activity_logger ON public.ticket_messages;
CREATE TRIGGER message_activity_logger
AFTER INSERT ON public.ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.log_message_activity();