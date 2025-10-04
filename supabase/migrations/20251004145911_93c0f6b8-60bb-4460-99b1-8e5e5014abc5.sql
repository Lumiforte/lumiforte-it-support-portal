-- Delete all Dutch, French, and German FAQ articles
DELETE FROM public.faq_articles 
WHERE language IN ('nl', 'fr', 'de');