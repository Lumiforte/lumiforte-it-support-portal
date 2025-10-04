-- Update the set_resolved_at trigger to clear dates when status changes back
CREATE OR REPLACE FUNCTION public.set_resolved_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Set resolved_at when status changes to resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  
  -- Set closed_at when status changes to closed
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = NOW();
  END IF;
  
  -- Clear resolved_at when status changes from resolved to open or in_progress
  IF (OLD.status = 'resolved' OR OLD.status = 'closed') AND (NEW.status = 'open' OR NEW.status = 'in_progress') THEN
    NEW.resolved_at = NULL;
    NEW.closed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;