-- Update IT support question to include phone menu information
UPDATE public.faq_articles
SET content = CASE language
  WHEN 'en' THEN 'You can reach IT support through the following channels:

- Email: support@tccsmart.com
- Phone: +31 (0)85 106 11 51 (You will hear an automated menu in Dutch. Press 1 for sales or 2 for technical support. For non-Dutch speakers: when the menu starts, press 2 to reach the technical helpdesk)
- Portal: Create a support ticket through this portal for non-urgent matters'
  WHEN 'nl' THEN 'Je kunt IT-support bereiken via de volgende kanalen:

- E-mail: support@tccsmart.com
- Telefoon: +31 (0)85 106 11 51 (Je hoort een automatisch menu waarin gevraagd wordt om 1 te toetsen voor sales of 2 voor technische support)
- Portal: Maak een support ticket aan via deze portal voor niet-urgente zaken'
  WHEN 'fr' THEN 'Vous pouvez contacter le support informatique par les canaux suivants :

- E-mail : support@tccsmart.com
- Téléphone : +31 (0)85 106 11 51 (Vous entendrez un menu automatique en néerlandais. Appuyez sur 1 pour les ventes ou 2 pour le support technique. Pour les non-néerlandophones : lorsque le menu commence, appuyez sur 2 pour joindre le helpdesk technique)
- Portail : Créez un ticket de support via ce portail pour les questions non urgentes'
  WHEN 'de' THEN 'Sie können den IT-Support über folgende Kanäle erreichen:

- E-Mail: support@tccsmart.com
- Telefon: +31 (0)85 106 11 51 (Sie hören ein automatisches Menü auf Niederländisch. Drücken Sie 1 für Vertrieb oder 2 für technischen Support. Für Nicht-Niederländischsprachige: Wenn das Menü beginnt, drücken Sie 2, um den technischen Helpdesk zu erreichen)
- Portal: Erstellen Sie ein Support-Ticket über dieses Portal für nicht dringende Angelegenheiten'
END
WHERE title LIKE '%How do I get IT%support%' OR title LIKE '%Hoe krijg ik IT%support%' OR title LIKE '%Comment obtenir%support%' OR title LIKE '%Wie erhalte ich IT%Support%';

-- Update creating Teams channels question
UPDATE public.faq_articles
SET content = CASE language
  WHEN 'en' THEN 'Create a support ticket in this portal to request a new Teams channel. Click here to create a ticket: /create-ticket'
  WHEN 'nl' THEN 'Maak een support ticket aan in deze portal om een nieuw Teams kanaal aan te vragen. Klik hier om een ticket aan te maken: /create-ticket'
  WHEN 'fr' THEN 'Créez un ticket de support dans ce portail pour demander un nouveau canal Teams. Cliquez ici pour créer un ticket : /create-ticket'
  WHEN 'de' THEN 'Erstellen Sie ein Support-Ticket in diesem Portal, um einen neuen Teams-Kanal anzufordern. Klicken Sie hier, um ein Ticket zu erstellen: /create-ticket'
END
WHERE title LIKE '%creating%Teams%channel%' OR title LIKE '%Teams%kanaal%aanmaken%' OR title LIKE '%créer%canal%Teams%' OR title LIKE '%Teams%Kanal%erstellen%';

-- Update adding people to Teams channels question
UPDATE public.faq_articles
SET content = CASE language
  WHEN 'en' THEN 'Create a support ticket in this portal to request adding people to an existing Teams channel. Click here to create a ticket: /create-ticket'
  WHEN 'nl' THEN 'Maak een support ticket aan in deze portal om mensen toe te voegen aan een bestaand Teams kanaal. Klik hier om een ticket aan te maken: /create-ticket'
  WHEN 'fr' THEN 'Créez un ticket de support dans ce portail pour demander l''ajout de personnes à un canal Teams existant. Cliquez ici pour créer un ticket : /create-ticket'
  WHEN 'de' THEN 'Erstellen Sie ein Support-Ticket in diesem Portal, um Personen zu einem bestehenden Teams-Kanal hinzuzufügen. Klicken Sie hier, um ein Ticket zu erstellen: /create-ticket'
END
WHERE title LIKE '%adding%people%Teams%' OR title LIKE '%mensen%toevoegen%Teams%' OR title LIKE '%ajouter%personnes%Teams%' OR title LIKE '%Personen%Teams%hinzufügen%';

-- Update onboarding question
UPDATE public.faq_articles
SET content = CASE language
  WHEN 'en' THEN 'Onboarding and offboarding of employees is largely handled centrally by Global IT (Jeroen Vrieselaar). This is always triggered by HR - the HR manager at Lumiforte notifies when someone is joining or leaving.

IT onboarding includes:
- Setting up email accounts and Microsoft 365 access
- Creating user accounts for necessary systems
- Providing necessary hardware and software (Note: In France, hardware is arranged locally; all other aspects are handled centrally)
- Configuring access permissions based on role

Click here to create a ticket to notify us of a new employee: /create-ticket'
  WHEN 'nl' THEN 'De onboarding en offboarding van medewerkers wordt voor een groot deel centraal opgepakt door Global IT (Jeroen Vrieselaar). Dit wordt altijd getriggerd door HR - de HR manager van Lumiforte geeft door dat iemand binnenkomt of vertrekt.

IT onboarding omvat:
- Het opzetten van e-mailaccounts en Microsoft 365 toegang
- Het aanmaken van gebruikersaccounts voor benodigde systemen
- Het verstrekken van benodigde hardware en software (Let op: In Frankrijk wordt hardware lokaal geregeld; alle andere aspecten worden centraal afgehandeld)
- Het configureren van toegangsrechten op basis van functie

Klik hier om een ticket aan te maken om een nieuwe medewerker door te geven: /create-ticket'
  WHEN 'fr' THEN 'L''intégration et le départ des employés sont en grande partie gérés centralement par Global IT (Jeroen Vrieselaar). Cela est toujours déclenché par les RH - le responsable RH de Lumiforte notifie lorsque quelqu''un arrive ou part.

L''intégration informatique comprend :
- La configuration des comptes de messagerie et de l''accès Microsoft 365
- La création de comptes utilisateur pour les systèmes nécessaires
- La fourniture du matériel et des logiciels nécessaires (Remarque : En France, le matériel est organisé localement ; tous les autres aspects sont gérés centralement)
- La configuration des autorisations d''accès en fonction du rôle

Cliquez ici pour créer un ticket pour nous informer d''un nouvel employé : /create-ticket'
  WHEN 'de' THEN 'Das Onboarding und Offboarding von Mitarbeitern wird größtenteils zentral von Global IT (Jeroen Vrieselaar) durchgeführt. Dies wird immer durch HR ausgelöst - der HR-Manager bei Lumiforte benachrichtigt, wenn jemand kommt oder geht.

IT-Onboarding umfasst:
- Einrichtung von E-Mail-Konten und Microsoft 365-Zugang
- Erstellung von Benutzerkonten für notwendige Systeme
- Bereitstellung notwendiger Hardware und Software (Hinweis: In Frankreich wird Hardware lokal organisiert; alle anderen Aspekte werden zentral verwaltet)
- Konfiguration von Zugriffsberechtigungen basierend auf der Rolle

Klicken Sie hier, um ein Ticket zu erstellen, um uns über einen neuen Mitarbeiter zu informieren: /create-ticket'
END
WHERE title LIKE '%How does IT onboarding work%' OR title LIKE '%Hoe werkt IT onboarding%' OR title LIKE '%Comment fonctionne%intégration%' OR title LIKE '%Wie funktioniert IT%Onboarding%';