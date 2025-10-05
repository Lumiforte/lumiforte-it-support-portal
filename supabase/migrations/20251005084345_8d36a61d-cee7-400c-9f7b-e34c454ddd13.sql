-- Update function to auto-assign both Salesforce and Hardware tickets
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
  
  -- If the ticket category is 'hardware', automatically assign to Jeroen Vee
  IF NEW.category = 'hardware' AND NEW.assigned_to IS NULL THEN
    NEW.assigned_to = 'b9a5d7fd-1869-44cc-bcd1-89928b494989'; -- Jeroen Vee user ID
  END IF;
  
  RETURN NEW;
END;
$function$;