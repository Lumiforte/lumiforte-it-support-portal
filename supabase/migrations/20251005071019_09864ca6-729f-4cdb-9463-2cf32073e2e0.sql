-- Add phone_number field to tickets table
ALTER TABLE public.tickets
ADD COLUMN phone_number text;