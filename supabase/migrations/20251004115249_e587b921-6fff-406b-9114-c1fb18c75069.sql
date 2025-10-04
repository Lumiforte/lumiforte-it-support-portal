-- Fix the database schema to match the existing code expectations

-- Create storage bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Insert FAQ data
INSERT INTO public.faq_articles (title, content, category, tags) VALUES
('Wat doet de IT-afdeling?', 'De IT-afdeling van Lumiforte ondersteunt het bedrijf op alle vlakken die met IT te maken hebben. Dit omvat het beheren van hardware, software, netwerken en het bieden van technische ondersteuning aan alle medewerkers.', 'Algemeen', ARRAY['IT', 'algemeen', 'verantwoordelijkheden']),
('Welke hardware-standaarden hanteert Lumiforte?', 'Lumiforte hanteert HP als standaard voor laptops en desktops. Voor monitoren gebruiken we voornamelijk Dell-producten. Alle hardware wordt centraal beheerd door de IT-afdeling.', 'Hardware', ARRAY['hardware', 'standaarden', 'HP', 'Dell']),
('Waar moet ik mijn bestanden opslaan?', 'Alle werkgerelateerde bestanden moeten worden opgeslagen op de netwerkschijven (G-schijf voor persoonlijke bestanden, H-schijf voor gedeelde teambestanden). Deze schijven worden dagelijks automatisch ge-backupt. Bewaar geen belangrijke werkdocumenten lokaal op je computer.', 'Netwerk & Opslag', ARRAY['bestanden', 'opslag', 'netwerk', 'backup']),
('Hoe vraag ik IT-ondersteuning aan?', 'IT-ondersteuning kun je aanvragen via dit ticketsysteem. Klik op "Create Ticket" en beschrijf je probleem zo gedetailleerd mogelijk. Voor urgente zaken kun je ook bellen naar extensie 101 (IT Helpdesk).', 'Support', ARRAY['support', 'helpdesk', 'ticket']),
('Wat gebeurt er bij mijn onboarding?', 'Bij je onboarding zorgt IT ervoor dat je laptop, accounts en toegang tot alle benodigde systemen klaar staan. Je krijgt een introductie over het gebruik van onze IT-systemen en ontvangt een welkomstmail met alle inloggegevens.', 'Onboarding', ARRAY['onboarding', 'nieuwe medewerker', 'account']),
('Hoe verkrijg ik een softwarelicentie?', 'Voor nieuwe software moet je eerst een ticket aanmaken waarin je aangeeft welke software je nodig hebt en waarvoor. De IT-afdeling beoordeelt het verzoek en regelt indien goedgekeurd de licentie en installatie.', 'Software', ARRAY['software', 'licentie', 'aanvraag']),
('Kan ik zelf software installeren?', 'Nee, op Lumiforte-apparatuur mag alleen door IT goedgekeurde en geïnstalleerde software worden gebruikt. Dit is om veiligheidsredenen en om de stabiliteit van de systemen te waarborgen. Dien een ticket in voor software-aanvragen.', 'Software', ARRAY['software', 'installatie', 'beveiliging']),
('Hoe werkt de video-intercom?', 'De instructies voor de video-intercom zijn beschikbaar als PDF-document. Je kunt deze raadplegen voor stap-voor-stap uitleg over het gebruik van het systeem. Het document bevat ook troubleshooting tips.', 'Apparatuur', ARRAY['video-intercom', 'instructies', 'handleiding']);