-- Verwijder alle Nederlandse FAQ artikelen
DELETE FROM public.faq_articles 
WHERE title IN (
  'Wat doet de IT-afdeling?',
  'Welke hardware-standaarden hanteert Lumiforte?',
  'Waar moet ik mijn bestanden opslaan?',
  'Hoe vraag ik IT-ondersteuning aan?',
  'Wat gebeurt er bij mijn onboarding?',
  'Hoe verkrijg ik een softwarelicentie?',
  'Kan ik zelf software installeren?',
  'Hoe werkt de video-intercom?'
);

-- Voeg de video-intercom vraag toe in het Engels met aanklikbare PDF
INSERT INTO public.faq_articles (title, content, category, tags) VALUES
('How does the video intercom work?', 'Instructions for the video intercom are available as a PDF document. You can download and view the step-by-step guide here: [Video Intercom Instructions](/documents/instructions_video_intercom.pdf). The document also contains troubleshooting tips.', 'Equipment', ARRAY['video-intercom', 'instructions', 'manual'])
ON CONFLICT DO NOTHING;