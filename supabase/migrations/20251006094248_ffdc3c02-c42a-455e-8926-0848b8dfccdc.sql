-- Add invitation_sent_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN invitation_sent_at timestamp with time zone;