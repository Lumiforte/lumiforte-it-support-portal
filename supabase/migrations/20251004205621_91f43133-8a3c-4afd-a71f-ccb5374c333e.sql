-- Update ticket activity trigger to also log category changes
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

  -- Log category changes
  IF (TG_OP = 'UPDATE' AND OLD.category != NEW.category) THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'category_changed', OLD.category::text, NEW.category::text);
  END IF;

  RETURN NEW;
END;
$$;