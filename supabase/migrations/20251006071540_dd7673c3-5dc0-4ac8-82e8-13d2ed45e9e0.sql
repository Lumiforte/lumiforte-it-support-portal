-- Fix profiles table RLS policy to restrict access to personal data
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

CREATE POLICY "Users can view own profile or staff can view all"
ON profiles FOR SELECT
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'helpdesk'::app_role)
);