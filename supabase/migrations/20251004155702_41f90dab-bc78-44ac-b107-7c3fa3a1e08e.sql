-- Update RLS policies to allow both admin and helpdesk to manage tickets
DROP POLICY IF EXISTS "Only admins can update tickets" ON public.tickets;

CREATE POLICY "Admins and helpdesk can update tickets"
ON public.tickets
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'helpdesk'::app_role)
);

-- Update ticket messages policy to allow helpdesk to create admin replies
DROP POLICY IF EXISTS "Users can create messages for their tickets" ON public.ticket_messages;

CREATE POLICY "Users can create messages for their tickets"
ON public.ticket_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (created_by = auth.uid()) AND 
  (EXISTS (
    SELECT 1
    FROM tickets
    WHERE tickets.id = ticket_messages.ticket_id 
    AND (
      tickets.created_by = auth.uid() OR 
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'helpdesk'::app_role)
    )
  ))
);

-- Update tickets view policy to allow helpdesk to see all tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;

CREATE POLICY "Users can view their tickets or all if admin/helpdesk"
ON public.tickets
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'helpdesk'::app_role)
);