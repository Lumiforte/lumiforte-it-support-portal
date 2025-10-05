-- Add language preference column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN preferred_language text DEFAULT 'en' CHECK (preferred_language IN ('en', 'nl', 'fr', 'de'));