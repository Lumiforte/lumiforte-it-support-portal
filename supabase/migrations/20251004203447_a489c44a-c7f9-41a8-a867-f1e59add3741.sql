-- Add resolved_at and closed_at columns to tickets table
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone;

-- Create a trigger to automatically set resolved_at when status changes to resolved
CREATE OR REPLACE FUNCTION public.set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for tickets table
DROP TRIGGER IF EXISTS set_ticket_timestamps ON public.tickets;
CREATE TRIGGER set_ticket_timestamps
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_resolved_at();