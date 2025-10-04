-- Update existing software license question to be Microsoft-specific
UPDATE public.faq_articles
SET 
  title = CASE language
    WHEN 'en' THEN 'How do I request licenses for Microsoft products?'
    WHEN 'nl' THEN 'Hoe vraag ik licenties aan voor Microsoft producten?'
    WHEN 'fr' THEN 'Comment demander des licences pour les produits Microsoft ?'
    WHEN 'de' THEN 'Wie beantrage ich Lizenzen für Microsoft-Produkte?'
  END,
  content = CASE language
    WHEN 'en' THEN 'Contact your direct manager with your request. Your manager will contact Jeroen Vrieselaar for the licenses.'
    WHEN 'nl' THEN 'Neem contact op met je direct manager met je verzoek. Je manager zal contact opnemen met Jeroen Vrieselaar voor de licenties.'
    WHEN 'fr' THEN 'Contactez votre manager direct avec votre demande. Votre manager contactera Jeroen Vrieselaar pour les licences.'
    WHEN 'de' THEN 'Kontaktieren Sie Ihren direkten Manager mit Ihrer Anfrage. Ihr Manager wird Jeroen Vrieselaar für die Lizenzen kontaktieren.'
  END
WHERE title LIKE '%software%license%' OR title LIKE '%software%licentie%' OR title LIKE '%logiciel%' OR title LIKE '%Software%Lizenz%';

-- Insert Salesforce license question
INSERT INTO public.faq_articles (title, content, category, tags, language)
VALUES
  -- English
  ('How do I request licenses for Salesforce?', 
   'Contact your direct manager with your request. Your manager will contact Bas Moeskoops for the licenses.',
   'Licenses',
   ARRAY['salesforce', 'licenses'],
   'en'),
  -- Dutch
  ('Hoe vraag ik licenties aan voor Salesforce?',
   'Neem contact op met je direct manager met je verzoek. Je manager zal contact opnemen met Bas Moeskoops voor de licenties.',
   'Licenties',
   ARRAY['salesforce', 'licenties'],
   'nl'),
  -- French
  ('Comment demander des licences pour Salesforce ?',
   'Contactez votre manager direct avec votre demande. Votre manager contactera Bas Moeskoops pour les licences.',
   'Licences',
   ARRAY['salesforce', 'licences'],
   'fr'),
  -- German
  ('Wie beantrage ich Lizenzen für Salesforce?',
   'Kontaktieren Sie Ihren direkten Manager mit Ihrer Anfrage. Ihr Manager wird Bas Moeskoops für die Lizenzen kontaktieren.',
   'Lizenzen',
   ARRAY['salesforce', 'lizenzen'],
   'de');

-- Insert AI tools license question
INSERT INTO public.faq_articles (title, content, category, tags, language)
VALUES
  -- English
  ('How do I request licenses for ChatGPT, Copilot or any other AI tool?',
   'Contact your direct manager with your request. Your manager will contact Jeroen Vrieselaar for the licenses. We evaluate each request individually to determine which tool is necessary for which department or employee.',
   'Licenses',
   ARRAY['ai', 'chatgpt', 'copilot', 'licenses'],
   'en'),
  -- Dutch
  ('Hoe vraag ik licenties aan voor ChatGPT, Copilot of een andere AI tool?',
   'Neem contact op met je direct manager met je verzoek. Je manager zal contact opnemen met Jeroen Vrieselaar voor de licenties. We bekijken per keer welke tool voor welke afdeling of medewerker noodzakelijk is.',
   'Licenties',
   ARRAY['ai', 'chatgpt', 'copilot', 'licenties'],
   'nl'),
  -- French
  ('Comment demander des licences pour ChatGPT, Copilot ou tout autre outil IA ?',
   'Contactez votre manager direct avec votre demande. Votre manager contactera Jeroen Vrieselaar pour les licences. Nous évaluons chaque demande individuellement pour déterminer quel outil est nécessaire pour quel département ou employé.',
   'Licences',
   ARRAY['ia', 'chatgpt', 'copilot', 'licences'],
   'fr'),
  -- German
  ('Wie beantrage ich Lizenzen für ChatGPT, Copilot oder andere KI-Tools?',
   'Kontaktieren Sie Ihren direkten Manager mit Ihrer Anfrage. Ihr Manager wird Jeroen Vrieselaar für die Lizenzen kontaktieren. Wir bewerten jede Anfrage einzeln, um zu bestimmen, welches Tool für welche Abteilung oder welchen Mitarbeiter notwendig ist.',
   'Lizenzen',
   ARRAY['ki', 'chatgpt', 'copilot', 'lizenzen'],
   'de');