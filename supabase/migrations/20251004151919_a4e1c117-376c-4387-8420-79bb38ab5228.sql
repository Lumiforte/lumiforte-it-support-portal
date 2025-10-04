-- Make "create a support ticket" clickable in the email access question
UPDATE public.faq_articles
SET content = REPLACE(
  content,
  'If you''re still unable to access your email after these steps, please create a support ticket immediately.',
  'If you''re still unable to access your email after these steps, please [Create a support ticket] immediately.'
)
WHERE content LIKE '%If you''re still unable to access your email after these steps%';