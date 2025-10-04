-- Update license request texts to use ticket creation instead of contacting Jeroen directly
UPDATE public.faq_articles
SET content = REPLACE(
  content,
  'Contact your direct manager with your request. Your manager will contact Jeroen Vrieselaar for the licenses.',
  'Contact your direct manager with your request. Your manager can [Create a support ticket] for the licenses.'
)
WHERE content LIKE '%Your manager will contact Jeroen Vrieselaar for the licenses%';

UPDATE public.faq_articles
SET content = REPLACE(
  content,
  'your manager will contact Jeroen Vrieselaar for the licenses',
  'your manager can [Create a support ticket] for the licenses'
)
WHERE content LIKE '%your manager will contact Jeroen Vrieselaar for the licenses%';

-- Also update the AI tools question which has additional text
UPDATE public.faq_articles
SET content = REPLACE(
  content,
  'Contact your direct manager with your request. Your manager will contact Jeroen Vrieselaar for the licenses. We evaluate each request individually to determine which tool is necessary for which department or employee.',
  'Contact your direct manager with your request. Your manager can [Create a support ticket] for the licenses. We evaluate each request individually to determine which tool is necessary for which department or employee.'
)
WHERE content LIKE '%We evaluate each request individually%';