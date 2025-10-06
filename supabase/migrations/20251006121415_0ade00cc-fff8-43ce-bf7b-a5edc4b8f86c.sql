-- Add triggers to log all user, role, and profile changes

-- Trigger for role additions/removals
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_email TEXT;
  v_action TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  
  IF (TG_OP = 'INSERT') THEN
    v_action := 'role_added';
    PERFORM log_audit_entry(
      auth.uid(),
      v_user_email,
      v_action,
      'user_roles',
      NEW.user_id::text,
      NULL,
      jsonb_build_object('role', NEW.role)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'role_removed';
    PERFORM log_audit_entry(
      auth.uid(),
      v_user_email,
      v_action,
      'user_roles',
      OLD.user_id::text,
      jsonb_build_object('role', OLD.role),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for role changes
DROP TRIGGER IF EXISTS log_user_role_changes ON public.user_roles;
CREATE TRIGGER log_user_role_changes
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.log_role_change();

-- Trigger for profile updates
CREATE OR REPLACE FUNCTION public.log_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_email TEXT;
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  
  -- Build old and new values objects
  v_old_values := jsonb_build_object(
    'full_name', OLD.full_name,
    'email', OLD.email,
    'company', OLD.company,
    'phone_number', OLD.phone_number
  );
  
  v_new_values := jsonb_build_object(
    'full_name', NEW.full_name,
    'email', NEW.email,
    'company', NEW.company,
    'phone_number', NEW.phone_number
  );
  
  -- Only log if something actually changed
  IF v_old_values IS DISTINCT FROM v_new_values THEN
    PERFORM log_audit_entry(
      auth.uid(),
      v_user_email,
      'profile_updated',
      'profiles',
      NEW.id::text,
      v_old_values,
      v_new_values
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS log_profile_updates ON public.profiles;
CREATE TRIGGER log_profile_updates
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_profile_update();

-- Trigger for ticket status/assignment changes (enhanced)
CREATE OR REPLACE FUNCTION public.log_ticket_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_email TEXT;
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  
  IF (TG_OP = 'INSERT') THEN
    PERFORM log_audit_entry(
      auth.uid(),
      v_user_email,
      'ticket_created',
      'tickets',
      NEW.id::text,
      NULL,
      jsonb_build_object(
        'title', NEW.title,
        'status', NEW.status,
        'priority', NEW.priority,
        'category', NEW.category
      )
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Build old and new values
    v_old_values := jsonb_build_object(
      'status', OLD.status,
      'priority', OLD.priority,
      'assigned_to', OLD.assigned_to
    );
    
    v_new_values := jsonb_build_object(
      'status', NEW.status,
      'priority', NEW.priority,
      'assigned_to', NEW.assigned_to
    );
    
    -- Only log if something changed
    IF v_old_values IS DISTINCT FROM v_new_values THEN
      PERFORM log_audit_entry(
        auth.uid(),
        v_user_email,
        'ticket_updated',
        'tickets',
        NEW.id::text,
        v_old_values,
        v_new_values
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for ticket changes
DROP TRIGGER IF EXISTS log_all_ticket_changes ON public.tickets;
CREATE TRIGGER log_all_ticket_changes
AFTER INSERT OR UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.log_ticket_changes();