-- Remove the "Click here to create a ticket" line from onboarding
UPDATE public.faq_articles
SET content = REPLACE(
  content,
  E'\n\nClick here to create a ticket to notify us of a new employee: [Create a support ticket]',
  ''
)
WHERE content LIKE '%Click here to create a ticket to notify us of a new employee%';

UPDATE public.faq_articles
SET content = REPLACE(
  content,
  E'Click here to create a ticket to notify us of a new employee: [Create a support ticket]',
  ''
)
WHERE content LIKE '%Click here to create a ticket to notify us of a new employee%';