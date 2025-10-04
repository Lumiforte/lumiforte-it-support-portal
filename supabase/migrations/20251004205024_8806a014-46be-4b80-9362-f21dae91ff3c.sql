-- Fix RLS policy for ticket_messages to allow helpdesk users to view messages
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON ticket_messages;

CREATE POLICY "Users can view messages for their tickets"
ON ticket_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM tickets
    WHERE tickets.id = ticket_messages.ticket_id
    AND (
      tickets.created_by = auth.uid()
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'helpdesk')
    )
  )
);