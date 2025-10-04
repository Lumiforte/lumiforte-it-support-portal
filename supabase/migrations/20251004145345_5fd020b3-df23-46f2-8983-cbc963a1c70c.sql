-- Restore complete IT support information with phone menu details
UPDATE public.faq_articles
SET content = CASE language
  WHEN 'en' THEN 'IT support is available through the following channels:

**Global support (Dutch and English):**
Available for all Lumiforte colleagues worldwide:
- TCC Smart IT Solutions
- Phone: +31 43 363 03 62 (You will hear an automated menu in Dutch. Press 1 for sales or 2 for technical support. For non-Dutch speakers: when the menu starts, press 2 to reach the technical helpdesk)
- Email: support@tcc.eu

**France:**
- Colleagues can contact TCC (see above)
- Alternatively, you can also contact AXE Informatique (www.axeinfo.fr)

**Common support requests:**
- Creating Teams channels: Create a support ticket in this portal /create-ticket
- Adding people to existing teams/channels: Create a support ticket in this portal /create-ticket
- TCC may request approval from someone within Lumiforte before taking action

For specific systems:
- **Salesforce support**: Contact Bas Moeskops
- **PowerBI reports**: Contact the colleague who created the specific report
- **QC/Production reports (Baarle-Nassau)**: Contact Daan van Rijen
- **Financial/Sales reports**: Contact Slava or Rémi'
  WHEN 'nl' THEN 'IT-ondersteuning is beschikbaar via de volgende kanalen:

**Wereldwijde ondersteuning (Nederlands en Engels):**
Beschikbaar voor alle Lumiforte-collega''s wereldwijd:
- TCC Smart IT Solutions
- Telefoon: +31 43 363 03 62 (Je hoort een automatisch menu waarin gevraagd wordt om 1 te toetsen voor sales of 2 voor technische support)
- E-mail: support@tcc.eu

**Frankrijk:**
- Collega''s kunnen contact opnemen met TCC (zie hierboven)
- Daarnaast kunt u ook contact opnemen met AXE Informatique (www.axeinfo.fr)

**Veelvoorkomende ondersteuningsverzoeken:**
- Teams kanalen aanmaken: Maak een support ticket aan in deze portal /create-ticket
- Mensen toevoegen aan bestaande teams/kanalen: Maak een support ticket aan in deze portal /create-ticket
- TCC kan goedkeuring vragen van iemand binnen Lumiforte voordat ze actie ondernemen

Voor specifieke systemen:
- **Salesforce-ondersteuning**: Neem contact op met Bas Moeskops
- **PowerBI-rapporten**: Neem contact op met de collega die het specifieke rapport heeft gemaakt
- **QC/Productierapporten (Baarle-Nassau)**: Neem contact op met Daan van Rijen
- **Financiële/Verkooprapporten**: Neem contact op met Slava of Rémi'
  WHEN 'fr' THEN 'Le support informatique est disponible via les canaux suivants :

**Support global (néerlandais et anglais) :**
Disponible pour tous les collègues Lumiforte dans le monde :
- TCC Smart IT Solutions
- Téléphone : +31 43 363 03 62 (Vous entendrez un menu automatique en néerlandais. Appuyez sur 1 pour les ventes ou 2 pour le support technique. Pour les non-néerlandophones : lorsque le menu commence, appuyez sur 2 pour joindre le helpdesk technique)
- E-mail : support@tcc.eu

**France :**
- Les collègues peuvent contacter TCC (voir ci-dessus)
- Vous pouvez également contacter AXE Informatique (www.axeinfo.fr)

**Demandes de support courantes :**
- Création de canaux Teams : Créez un ticket de support dans ce portail /create-ticket
- Ajout de personnes aux équipes/canaux existants : Créez un ticket de support dans ce portail /create-ticket
- TCC peut demander l''approbation d''une personne au sein de Lumiforte avant d''agir

Pour des systèmes spécifiques :
- **Support Salesforce** : Contactez Bas Moeskops
- **Rapports PowerBI** : Contactez le collègue qui a créé le rapport spécifique
- **Rapports QC/Production (Baarle-Nassau)** : Contactez Daan van Rijen
- **Rapports financiers/ventes** : Contactez Slava ou Rémi'
  WHEN 'de' THEN 'IT-Support ist über folgende Kanäle verfügbar:

**Globaler Support (Niederländisch und Englisch):**
Verfügbar für alle Lumiforte-Kollegen weltweit:
- TCC Smart IT Solutions
- Telefon: +31 43 363 03 62 (Sie hören ein automatisches Menü auf Niederländisch. Drücken Sie 1 für Vertrieb oder 2 für technischen Support. Für Nicht-Niederländischsprachige: Wenn das Menü beginnt, drücken Sie 2, um den technischen Helpdesk zu erreichen)
- E-Mail: support@tcc.eu

**Frankreich:**
- Kollegen können TCC kontaktieren (siehe oben)
- Alternativ können Sie auch AXE Informatique kontaktieren (www.axeinfo.fr)

**Häufige Support-Anfragen:**
- Teams-Kanäle erstellen: Erstellen Sie ein Support-Ticket in diesem Portal /create-ticket
- Personen zu bestehenden Teams/Kanälen hinzufügen: Erstellen Sie ein Support-Ticket in diesem Portal /create-ticket
- TCC kann vor Maßnahmen eine Genehmigung von jemandem innerhalb von Lumiforte anfordern

Für spezifische Systeme:
- **Salesforce-Support**: Kontaktieren Sie Bas Moeskops
- **PowerBI-Berichte**: Kontaktieren Sie den Kollegen, der den spezifischen Bericht erstellt hat
- **QC/Produktionsberichte (Baarle-Nassau)**: Kontaktieren Sie Daan van Rijen
- **Finanz-/Vertriebsberichte**: Kontaktieren Sie Slava oder Rémi'
END
WHERE title LIKE '%How do I get IT%support%' OR title LIKE '%Hoe krijg ik IT%support%' OR title LIKE '%Comment obtenir%support%' OR title LIKE '%Wie erhalte ich IT%Support%';