-- Function to auto-assign Salesforce tickets to Bas Moeskops
CREATE OR REPLACE FUNCTION public.auto_assign_salesforce_tickets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If the ticket category is 'salesforce', automatically assign to Bas Moeskops
  IF NEW.category = 'salesforce' AND NEW.assigned_to IS NULL THEN
    NEW.assigned_to = '6b602d09-b90b-48f3-aebd-38772baee4b4'; -- Bas Moeskops user ID
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger that runs before insert on tickets
DROP TRIGGER IF EXISTS trigger_auto_assign_salesforce ON public.tickets;
CREATE TRIGGER trigger_auto_assign_salesforce
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_salesforce_tickets();