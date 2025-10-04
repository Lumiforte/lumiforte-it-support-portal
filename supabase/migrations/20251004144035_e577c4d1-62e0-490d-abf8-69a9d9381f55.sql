-- Add language column to faq_articles
ALTER TABLE public.faq_articles 
ADD COLUMN language text NOT NULL DEFAULT 'en';

-- Update existing articles to be English
UPDATE public.faq_articles SET language = 'en';

-- Create index on language for better performance
CREATE INDEX idx_faq_articles_language ON public.faq_articles(language);

-- Now insert Dutch translations for all existing English articles
INSERT INTO public.faq_articles (title, content, category, tags, language)
SELECT 
  CASE title
    WHEN 'How does IT onboarding work for new employees?' THEN 'Hoe werkt IT onboarding voor nieuwe medewerkers?'
    WHEN 'How do I request software licenses?' THEN 'Hoe vraag ik softwarelicenties aan?'
    WHEN 'Where should I store my work files?' THEN 'Waar moet ik mijn werkbestanden opslaan?'
    WHEN 'How do I get IT support at Lumiforte?' THEN 'Hoe krijg ik IT-ondersteuning bij Lumiforte?'
    WHEN 'Who is responsible for IT at Lumiforte?' THEN 'Wie is verantwoordelijk voor IT bij Lumiforte?'
    WHEN 'What hardware standards does Lumiforte use?' THEN 'Welke hardwarestandaarden gebruikt Lumiforte?'
    WHEN 'How do I set up my printer?' THEN 'Hoe stel ik mijn printer in?'
    WHEN 'My computer won''t turn on. What should I do?' THEN 'Mijn computer start niet op. Wat moet ik doen?'
    WHEN 'My screen is frozen. What should I do?' THEN 'Mijn scherm is bevroren. Wat moet ik doen?'
    WHEN 'How do I install software on my work computer?' THEN 'Hoe installeer ik software op mijn werkcomputer?'
    WHEN 'How do I connect to the office Wi-Fi?' THEN 'Hoe maak ik verbinding met het kantoor Wi-Fi?'
    WHEN 'How do I reset my password?' THEN 'Hoe reset ik mijn wachtwoord?'
    WHEN 'I can''t access my email. What should I do?' THEN 'Ik heb geen toegang tot mijn e-mail. Wat moet ik doen?'
    WHEN 'How do I report a security concern or phishing email?' THEN 'Hoe meld ik een beveiligingsprobleem of phishing-e-mail?'
    WHEN 'What is the password policy for company accounts?' THEN 'Wat is het wachtwoordbeleid voor bedrijfsaccounts?'
    WHEN 'How does the video intercom system work?' THEN 'Hoe werkt het video-intercomsysteem?'
  END as title,
  CASE title
    WHEN 'How does IT onboarding work for new employees?' THEN 'IT onboarding wordt verschillend afgehandeld afhankelijk van de entiteit:

**Lumiforte EMEA SAS:**
- Geregeld door Rémi Weber
- Getriggerd door HR

**Alle andere entiteiten:**
- Geregeld door Jeroen Vrieselaar
- Getriggerd door HR

**IT onboarding omvat:**
- Aanmaken van nieuwe accounts
- Toevoegen aan relevante groepen en teams
- Toevoegen aan gedeelde mailboxen
- Hardware voorbereiden (laptop, telefoon indien van toepassing)
- Toegang instellen tot benodigde systemen

Nieuwe medewerkers moeten samenwerken met HR om dit proces te starten.'
    WHEN 'How do I request software licenses?' THEN 'Om een licentie aan te vragen voor softwareproducten (zoals PowerBI, ChatGPT of CoPilot):

1. Neem contact op met uw direct leidinggevende met het verzoek
2. Uw leidinggevende neemt contact op met Jeroen Vrieselaar voor licenties
3. IT beoordeelt het verzoek op:
   - Beveiligingscompliantie
   - Licentievereisten
   - Zakelijke rechtvaardiging

**Belangrijk**: Download nooit software van onofficiële bronnen. Dit beleid helpt de beveiliging en softwarelicentiecompliantie te behouden.

Alle software-installaties vereisen beheerdersrechten en moeten via het officiële aanvraagproces verlopen.'
    WHEN 'Where should I store my work files?' THEN 'Alle gebruikersgegevens moeten worden opgeslagen in:
- **OneDrive** - voor individuele bestanden
- **Microsoft Teams** - voor gedeelde teambestanden

**Belangrijk**: Sla nooit alleen bestanden op uw laptop op. Het opslaan van bestanden in de cloud zorgt voor:
- Bescherming tegen gegevensverlies door hardwarefalen, defecten of diefstal
- Juiste en veilige back-up van bedrijfsgegevens
- Toegang tot uw bestanden vanaf elk apparaat
- Automatische synchronisatie tussen apparaten

Microsoft Office365 is het leidende platform bij Lumiforte, en Microsoft Teams is de interne standaard voor communicatie en gegevensdeling.'
    WHEN 'How do I get IT support at Lumiforte?' THEN 'IT-ondersteuning is beschikbaar via de volgende kanalen:

**Wereldwijde ondersteuning (Nederlands en Engels):**
Beschikbaar voor alle Lumiforte-collega''s wereldwijd:
- TCC Smart IT Solutions
- Telefoon: +31 43 363 03 62
- E-mail: support@tcc.eu

**Frankrijk:**
- Collega''s kunnen contact opnemen met TCC (zie hierboven)
- Daarnaast kunt u ook contact opnemen met AXE Informatique (www.axeinfo.fr)

**Veelvoorkomende ondersteuningsverzoeken:**
- Teams of kanalen aanmaken in Microsoft Teams: Neem contact op met TCC via e-mail
- Mensen toevoegen aan bestaande teams/kanalen: Neem contact op met TCC via e-mail
- TCC kan goedkeuring vragen van iemand binnen Lumiforte voordat ze actie ondernemen

Voor specifieke systemen:
- **Salesforce-ondersteuning**: Neem contact op met Bas Moeskops
- **PowerBI-rapporten**: Neem contact op met de collega die het specifieke rapport heeft gemaakt
- **QC/Productierapporten (Baarle-Nassau)**: Neem contact op met Daan van Rijen
- **Financiële/Verkooprapporten**: Neem contact op met Slava of Rémi'
    WHEN 'Who is responsible for IT at Lumiforte?' THEN 'IT-verantwoordelijkheden bij Lumiforte zijn als volgt verdeeld:

- **Wereldwijd IT**: Jeroen Vrieselaar
- **Lumiforte EMEA SAS**: Rémi Weber
- **Sport-lines GmbH**: Jort Gerritsen
- **Andere entiteiten**: Jeroen Vrieselaar

Naast deze belangrijke contactpersonen is er lokale IT-ondersteuning beschikbaar op verschillende locaties om te helpen met dagelijkse IT-problemen.'
    WHEN 'What hardware standards does Lumiforte use?' THEN 'Lumiforte gebruikt Microsoft Surface-laptops als standaard hardware voor medewerkers, met enkele uitzonderingen op basis van specifieke functievereisten. Eventuele uitzonderingen moeten worden goedgekeurd door wereldwijd IT (Jeroen Vrieselaar of Jort Gerritsen).

Belangrijkste punten:
- Standaardapparaat: Microsoft Surface-laptops
- Mobiele telefoons voor bepaalde functies
- Alle apparaten worden centraal beheerd via Microsoft Intune
- Apparaten bevatten een ''Lumiforte software shell'' met minimale toepassingen en beveiligingsbeleid
- Defecte hardware wordt snel opgehaald en vervangen

Bij het vervangen van hardware moet oude apparatuur worden geretourneerd aan de lokale IT-verantwoordelijke voor mogelijk hergebruik of veilige vernietiging.'
    WHEN 'How do I set up my printer?' THEN 'Om verbinding te maken met een netwerkprinter:
1. Ga naar Instellingen > Apparaten > Printers & Scanners (Windows) of Systeemvoorkeuren > Printers (Mac)
2. Klik op "Printer toevoegen"
3. Selecteer de printer uit de lijst met beschikbare netwerkprinters
4. Installeer indien gevraagd de benodigde drivers
5. Stel indien gewenst in als standaardprinter

Als u de printer niet kunt vinden, noteer dan de naam/locatie van de printer en neem contact op met IT-ondersteuning voor hulp.'
    WHEN 'My computer won''t turn on. What should I do?' THEN 'Volg deze stappen voor probleemoplossing:
1. Controleer of de stroomkabel goed is aangesloten op zowel de computer als het stopcontact
2. Controleer of het stopcontact werkt door het te testen met een ander apparaat
3. Als u een laptop gebruikt, zorg ervoor dat de batterij is opgeladen of sluit de voedingsadapter aan
4. Probeer indien beschikbaar een andere stroomkabel
5. Luister naar piepjes of kijk naar LED-lampjes wanneer u de aan/uit-knop indrukt

Als geen van deze stappen werkt, dien dan een ondersteuningsticket in met details over wat u hebt waargenomen.'
    WHEN 'My screen is frozen. What should I do?' THEN 'Als uw scherm niet reageert:
1. Wacht 30 seconden om te zien of het systeem herstelt
2. Probeer Ctrl+Alt+Delete (Windows) of Command+Option+Esc (Mac) in te drukken
3. Sluit indien mogelijk de niet-reagerende toepassing
4. Als het volledig bevroren is, voer dan een harde herstart uit door de aan/uit-knop 10 seconden ingedrukt te houden
5. Sla na het herstarten uw werk regelmatig op

Als dit regelmatig gebeurt, maak dan een ondersteuningsticket aan omdat dit kan wijzen op een hardware- of softwareprobleem.'
    WHEN 'How do I install software on my work computer?' THEN 'Softwareinstallatiebeleid:
1. De meeste software-installaties vereisen beheerdersrechten
2. Dien een verzoek in via het IT-ondersteuningsportaal met vermelding van:
   - Naam van de software
   - Zakelijke rechtvaardiging
   - Afdelingsgoedkeuring (indien vereist)
3. IT beoordeelt het verzoek op beveiligings- en licentiecompliantie
4. Goedgekeurde software wordt geïnstalleerd door IT-personeel
5. Download nooit software van onofficiële bronnen

Dit beleid helpt de beveiliging en softwarelicentiecompliantie te behouden.'
    WHEN 'How do I connect to the office Wi-Fi?' THEN 'Om verbinding te maken met het kantoor Wi-Fi-netwerk:
1. Open de Wi-Fi-instellingen van uw apparaat
2. Zoek naar de netwerknaam die door IT is verstrekt (meestal de bedrijfsnaam)
3. Selecteer het netwerk en voer het wachtwoord in
4. Accepteer indien gevraagd beveiligingscertificaten
5. Uw apparaat zou nu verbonden moeten zijn

Voor gast-Wi-Fi-toegang kunt u contact opnemen met de receptie of IT-afdeling voor tijdelijke inloggegevens.'
    WHEN 'How do I reset my password?' THEN 'Om uw wachtwoord te resetten:
1. Klik op "Wachtwoord vergeten" op de inlogpagina
2. Voer uw e-mailadres in
3. Controleer uw e-mail voor een wachtwoordresetlink
4. Klik op de link en maak een nieuw wachtwoord aan
5. Zorg ervoor dat uw nieuwe wachtwoord minimaal 8 tekens lang is en hoofdletters, kleine letters, cijfers en speciale tekens bevat

Als u de e-mail niet binnen 5 minuten ontvangt, controleer dan uw spam-map of neem contact op met IT-ondersteuning.'
    WHEN 'I can''t access my email. What should I do?' THEN 'Als u problemen heeft met e-mailtoegang:
1. Controleer of u het juiste e-mailadres en wachtwoord gebruikt
2. Controleer uw internetverbinding
3. Wis uw browsercache en cookies als u webmail gebruikt
4. Probeer toegang tot e-mail vanaf een andere browser of apparaat
5. Zorg ervoor dat uw account niet is vergrendeld vanwege meerdere mislukte inlogpogingen

Als u na deze stappen nog steeds geen toegang heeft tot uw e-mail, maak dan onmiddellijk een ondersteuningsticket aan.'
    WHEN 'How do I report a security concern or phishing email?' THEN 'Om beveiligingsproblemen te melden:
1. Klik NIET op links of download geen bijlagen van verdachte e-mails
2. Beantwoord of stuur de verdachte e-mail NIET door
3. Maak een urgent ondersteuningsticket aan of neem onmiddellijk contact op met IT
4. Als het een phishing-e-mail is, gebruik dan de knop "Phishing melden" in uw e-mailclient
5. Verwijder de e-mail pas nadat IT op de hoogte is gesteld

Veelvoorkomende phishing-tekenen:
- Verzoeken om wachtwoorden of persoonlijke informatie
- Urgente of dreigende taal
- Verdachte afzenderadressen
- Spel- en grammaticafouten
- Onverwachte bijlagen of links'
    WHEN 'What is the password policy for company accounts?' THEN 'Wachtwoordvereisten voor het bedrijf:
- Minimaal 8 tekens (12+ aanbevolen)
- Moet hoofdletters en kleine letters bevatten
- Moet minimaal één cijfer bevatten
- Moet minimaal één speciaal teken bevatten
- Kan laatste 5 wachtwoorden niet hergebruiken
- Moet elke 90 dagen worden gewijzigd
- Mag uw naam of gebruikersnaam niet bevatten

Tips voor sterke wachtwoorden:
- Gebruik een wachtwoordzin met willekeurige woorden
- Overweeg het gebruik van een wachtwoordbeheerder
- Deel uw wachtwoord nooit met iemand
- Gebruik verschillende wachtwoorden voor verschillende accounts'
    WHEN 'How does the video intercom system work?' THEN 'Lumiforte gebruikt een video-intercomsysteem bij de ingang dat is geïntegreerd met Microsoft Teams:

**Voor medewerkers:**
1. Houd de Teams-app open op zowel computer als telefoon
2. Wanneer een bezoeker belt, ontvangt u een Teams-oproep (met of zonder video)
3. Beantwoord de oproep en voer code **5111*** in via het Teams-toetsenblok (linksboven)
4. De bezoeker hoort de zoemer en kan naar binnen

**Voorbereiden op bezoekers:**
- Informeer bezoekers van tevoren om u rechtstreeks via de intercom te bellen
- Bezoekers moeten de optie "Ik heb een afspraak met…" selecteren
- Hierdoor kan iedereen zijn eigen bezoekers afhandelen zonder anderen te storen

**Vragen of problemen:**
Neem contact op met Kevin of Carlo voor praktische hulp bij de Teams-integratie of het openen van de deur.

Voor gedetailleerde instructies raadpleegt u de handleiding voor de video-intercom die beschikbaar is in de documentensectie.'
  END as content,
  CASE category
    WHEN 'Onboarding' THEN 'Onboarding'
    WHEN 'Software' THEN 'Software'
    WHEN 'Support' THEN 'Ondersteuning'
    WHEN 'IT Management' THEN 'IT Beheer'
    WHEN 'Hardware' THEN 'Hardware'
    WHEN 'Network' THEN 'Netwerk'
    WHEN 'Password & Account' THEN 'Wachtwoord & Account'
    WHEN 'Email' THEN 'E-mail'
    WHEN 'Security' THEN 'Beveiliging'
    WHEN 'Office' THEN 'Kantoor'
    WHEN 'Equipment' THEN 'Apparatuur'
    ELSE category
  END as category,
  tags,
  'nl' as language
FROM public.faq_articles
WHERE language = 'en';