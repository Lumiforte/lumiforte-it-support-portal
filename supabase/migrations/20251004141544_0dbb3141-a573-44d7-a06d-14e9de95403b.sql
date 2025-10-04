-- Update de video-intercom vraag met een betere content formatting
UPDATE public.faq_articles 
SET content = 'Instructions for the video intercom are available as a PDF document. You can download and view the step-by-step guide by clicking the link below. The document also contains troubleshooting tips.'
WHERE title = 'How does the video intercom work?';