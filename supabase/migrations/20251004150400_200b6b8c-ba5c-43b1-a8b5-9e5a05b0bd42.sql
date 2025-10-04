-- Update phone number text to remove sales/support menu
UPDATE public.faq_articles
SET content = REPLACE(
  content,
  'Phone: +31 43 363 03 62 (You will hear an automated menu in Dutch. Press 1 for sales or 2 for technical support. For non-Dutch speakers: when the menu starts, press 2 to reach the technical helpdesk)',
  'Phone: +31 43 363 03 62 (You will hear an automated menu in Dutch. For non-Dutch speakers: when the menu starts, press 2 to reach the technical helpdesk)'
)
WHERE content LIKE '%+31 43 363 03 62%';

-- Fix Moeskoops to Moeskops
UPDATE public.faq_articles
SET content = REPLACE(content, 'Moeskoops', 'Moeskops')
WHERE content LIKE '%Moeskoops%';

UPDATE public.faq_articles
SET content = REPLACE(content, 'Bas Moeskops', 'Bas Moeskops')
WHERE content LIKE '%Bas Moeskops%';

-- Remove TCC approval line
UPDATE public.faq_articles
SET content = REPLACE(
  content,
  '- TCC may request approval from someone within Lumiforte before taking action

',
  ''
)
WHERE content LIKE '%TCC may request approval%';

-- Update the local IT support sentence
UPDATE public.faq_articles
SET content = REPLACE(
  content,
  'In addition to these key contacts, local IT support is available in various locations to help with day-to-day IT issues.',
  'In addition to these key contacts, local IT support is available in various locations to help with day-to-day IT issues. For software specific to one department, there are often other contact persons. See Support section above.'
)
WHERE content LIKE '%In addition to these key contacts, local IT support%';