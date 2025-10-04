-- Add phone_number column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number text;

-- RLS policy for updating own profile already exists and allows users to update their own profile