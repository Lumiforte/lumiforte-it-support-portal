-- Update the IT responsibility question with new structure
UPDATE public.faq_articles
SET content = 'In general, IT is a global topic. Where possible we approach it in a global way, where needed we arrange some topics locally. 

- Global IT: Jeroen Vrieselaar & Jort Gerritsen

Contact persons for local entities:
- Echirolles (France): Rémi Weber or Valérie Fornes
- Baarle-Nassau (The Netherlands): Jeroen Vrieselaar
- Hamm (Germany): Jeroen Vrieselaar
- Beijing (China): Jeroen Vrieselaar
- All other entities: Jeroen Vrieselaar'
WHERE title LIKE '%Who is responsible for IT%' AND language = 'en';