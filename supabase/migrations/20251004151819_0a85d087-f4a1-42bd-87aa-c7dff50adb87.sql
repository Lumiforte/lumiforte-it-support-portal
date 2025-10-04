-- Remove the video intercom manual reference
UPDATE public.faq_articles
SET content = REPLACE(
  content,
  E'\n\nFor detailed instructions, refer to the video intercom manual available in the documents section.',
  ''
)
WHERE content LIKE '%For detailed instructions, refer to the video intercom manual%';

UPDATE public.faq_articles
SET content = REPLACE(
  content,
  'For detailed instructions, refer to the video intercom manual available in the documents section.',
  ''
)
WHERE content LIKE '%For detailed instructions, refer to the video intercom manual%';