-- Drop the restrictive UPDATE policy on profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a more permissive policy that allows admins to update any profile
CREATE POLICY "Users can update own profile or admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  auth.uid() = id OR has_role(auth.uid(), 'admin')
);