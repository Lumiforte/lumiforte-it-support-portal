-- Update FAQ content to have proper clickable links instead of "/create-ticket"
UPDATE public.faq_articles
SET content = REPLACE(
  content,
  '/create-ticket',
  '[Create a support ticket]'
)
WHERE content LIKE '%/create-ticket%';