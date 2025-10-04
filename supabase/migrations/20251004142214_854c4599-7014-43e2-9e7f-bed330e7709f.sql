-- Verwijder video intercom vraag bij Equipment
DELETE FROM public.faq_articles WHERE id = '5b230712-19d7-441f-8b56-2056837deb74';

-- Verwijder "Can I install software on my work laptop myself?"
DELETE FROM public.faq_articles WHERE id = '7e021f88-51c0-4fbb-922f-7692d9d4212a';

-- Update "Where should I store my work files?" - verwijder "personal" voor OneDrive
UPDATE public.faq_articles 
SET content = 'All user data should be stored in either:
- **OneDrive** - for individual files
- **Microsoft Teams** - for shared team files

**Important**: Never store files only on your laptop. Storing files in the cloud ensures:
- Protection against data loss from hardware failure, malfunction, or theft
- Proper and secure backup of company data
- Access to your files from any device
- Automatic synchronization across devices

Microsoft''s Office365 is the leading platform at Lumiforte, and Microsoft Teams is the internal standard for communication and data sharing.'
WHERE id = 'ed95217f-6cfe-4dc0-96d7-75b687818f14';

-- Verwijder één van de twee "How do I install software on my work computer?"
DELETE FROM public.faq_articles WHERE id = 'c0da56f9-f83e-4860-82e6-3978885ee1ac';

-- Update "How do I get IT support at Lumiforte?" 
UPDATE public.faq_articles 
SET content = 'IT support is available through the following channels:

**Global Support (Dutch and English):**
Available for all Lumiforte colleagues worldwide:
- TCC Smart IT Solutions
- Phone: +31 43 363 03 62
- Email: support@tcc.eu

**France:**
- Colleagues can contact TCC (see above)
- Additionally, you can also contact AXE Informatique (www.axeinfo.fr)

**Common Support Requests:**
- Creating teams or channels in Microsoft Teams: Contact TCC via email
- Adding people to existing teams/channels: Contact TCC via email
- TCC may request approval from someone within Lumiforte before acting

For specific systems:
- **Salesforce support**: Contact Bas Moeskops
- **PowerBI reports**: Contact the colleague who created the specific report
- **QC/Production reports (Baarle-Nassau)**: Contact Daan van Rijen
- **Financial/Sales reports**: Contact Slava or Rémi'
WHERE id = '75acf544-7ffa-4838-b272-6ad0e2067eef';

-- Verwijder duplicaat "My computer won't turn on"
DELETE FROM public.faq_articles WHERE id = 'cb540dc6-346b-4606-871b-8f6460b61263';

-- Verwijder duplicaat "How do I set up my printer?"
DELETE FROM public.faq_articles WHERE id = '774076fa-ed18-4037-8121-effa0a493902';

-- Verwijder duplicaat "My screen is frozen"
DELETE FROM public.faq_articles WHERE id = '3bd73aa4-a4a8-4ff6-841d-505da0bed88a';

-- Verwijder duplicaat "How do I reset my password?"
DELETE FROM public.faq_articles WHERE id = '42a4afb0-3ca6-4c50-9daf-175b146229d7';

-- Verwijder duplicaat "How do I connect to the office Wi-Fi?"
DELETE FROM public.faq_articles WHERE id = 'e93415a0-4834-4d6d-83f9-6f9a25551656';

-- Verwijder BEIDE "How do I access company files remotely?"
DELETE FROM public.faq_articles WHERE id IN ('5a8fad26-3bbb-4ed4-a217-6f2944bb9690', '799f2502-6151-4afa-a521-f964b3b7f4f5');

-- Verwijder duplicaat "I can't access my email"
DELETE FROM public.faq_articles WHERE id = 'cc097597-1869-489d-857a-e3b249809c37';

-- Verwijder duplicaat "How do I report a security concern?"
DELETE FROM public.faq_articles WHERE id = '5f5e0a2a-2fea-4878-bf59-9905c048b725';

-- Verwijder duplicaat "What is the password policy?"
DELETE FROM public.faq_articles WHERE id = 'df252627-537e-4b6a-bb2f-6333c86e2350';