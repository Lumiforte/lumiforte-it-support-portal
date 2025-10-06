-- Add main_category and sub_category columns to tickets table
ALTER TABLE public.tickets 
ADD COLUMN main_category text,
ADD COLUMN sub_category text;

-- Migrate existing data from category to new structure
UPDATE public.tickets
SET 
  main_category = CASE 
    WHEN category IN ('hardware', 'software', 'network', 'email', 'account', 'printer', 'intercom', 'salesforce', 'websites', 'intranet', 'licenses') THEN 'IT'
    ELSE 'Other'
  END,
  sub_category = category;

-- Now make main_category and sub_category NOT NULL
ALTER TABLE public.tickets 
ALTER COLUMN main_category SET NOT NULL,
ALTER COLUMN sub_category SET NOT NULL;

-- Keep the old category column for now for backwards compatibility
-- We can remove it later: ALTER TABLE public.tickets DROP COLUMN category;

-- Add index for better query performance
CREATE INDEX idx_tickets_main_category ON public.tickets(main_category);
CREATE INDEX idx_tickets_sub_category ON public.tickets(sub_category);
