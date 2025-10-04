-- Insert German translations for all English articles
INSERT INTO public.faq_articles (title, content, category, tags, language)
SELECT 
  CASE title
    WHEN 'How does IT onboarding work for new employees?' THEN 'Wie funktioniert IT-Onboarding für neue Mitarbeiter?'
    WHEN 'How do I request software licenses?' THEN 'Wie fordere ich Softwarelizenzen an?'
    WHEN 'Where should I store my work files?' THEN 'Wo soll ich meine Arbeitsdateien speichern?'
    WHEN 'How do I get IT support at Lumiforte?' THEN 'Wie erhalte ich IT-Support bei Lumiforte?'
    WHEN 'Who is responsible for IT at Lumiforte?' THEN 'Wer ist für IT bei Lumiforte verantwortlich?'
    WHEN 'What hardware standards does Lumiforte use?' THEN 'Welche Hardware-Standards verwendet Lumiforte?'
    WHEN 'How do I set up my printer?' THEN 'Wie richte ich meinen Drucker ein?'
    WHEN 'My computer won''t turn on. What should I do?' THEN 'Mein Computer lässt sich nicht einschalten. Was soll ich tun?'
    WHEN 'My screen is frozen. What should I do?' THEN 'Mein Bildschirm ist eingefroren. Was soll ich tun?'
    WHEN 'How do I install software on my work computer?' THEN 'Wie installiere ich Software auf meinem Arbeitscomputer?'
    WHEN 'How do I connect to the office Wi-Fi?' THEN 'Wie verbinde ich mich mit dem Büro-WLAN?'
    WHEN 'How do I reset my password?' THEN 'Wie setze ich mein Passwort zurück?'
    WHEN 'I can''t access my email. What should I do?' THEN 'Ich kann nicht auf meine E-Mail zugreifen. Was soll ich tun?'
    WHEN 'How do I report a security concern or phishing email?' THEN 'Wie melde ich ein Sicherheitsproblem oder eine Phishing-E-Mail?'
    WHEN 'What is the password policy for company accounts?' THEN 'Was ist die Passwortrichtlinie für Unternehmenskonten?'
    WHEN 'How does the video intercom system work?' THEN 'Wie funktioniert das Video-Gegensprechsystem?'
  END as title,
  CASE title
    WHEN 'How does IT onboarding work for new employees?' THEN 'IT-Onboarding wird je nach Entität unterschiedlich gehandhabt:

**Lumiforte EMEA SAS:**
- Organisiert von Rémi Weber
- Ausgelöst durch HR

**Alle anderen Entitäten:**
- Organisiert von Jeroen Vrieselaar
- Ausgelöst durch HR

**IT-Onboarding umfasst:**
- Erstellung neuer Konten
- Hinzufügen zu entsprechenden Gruppen und Teams
- Hinzufügen zu gemeinsamen Postfächern
- Vorbereitung der Hardware (Laptop, Telefon falls zutreffend)
- Einrichtung des Zugriffs auf erforderliche Systeme

Neue Mitarbeiter sollten mit der Personalabteilung zusammenarbeiten, um diesen Prozess zu starten.'
    WHEN 'How do I request software licenses?' THEN 'Um eine Lizenz für Softwareprodukte (wie PowerBI, ChatGPT oder CoPilot) anzufordern:

1. Kontaktieren Sie Ihren direkten Vorgesetzten mit der Anfrage
2. Ihr Vorgesetzter wird Jeroen Vrieselaar für Lizenzen kontaktieren
3. Die IT wird die Anfrage prüfen auf:
   - Sicherheitskonformität
   - Lizenzanforderungen
   - Geschäftliche Rechtfertigung

**Wichtig**: Laden Sie niemals Software aus inoffiziellen Quellen herunter. Diese Richtlinie hilft, Sicherheit und Software-Lizenzkonformität aufrechtzuerhalten.

Alle Softwareinstallationen erfordern Administratorrechte und müssen über den offiziellen Anfrageprozess erfolgen.'
    WHEN 'Where should I store my work files?' THEN 'Alle Benutzerdaten sollten gespeichert werden in:
- **OneDrive** - für einzelne Dateien
- **Microsoft Teams** - für gemeinsame Teamdateien

**Wichtig**: Speichern Sie niemals Dateien nur auf Ihrem Laptop. Das Speichern von Dateien in der Cloud gewährleistet:
- Schutz vor Datenverlust durch Hardwareausfall, Fehlfunktion oder Diebstahl
- Ordnungsgemäße und sichere Sicherung von Unternehmensdaten
- Zugriff auf Ihre Dateien von jedem Gerät aus
- Automatische Synchronisierung zwischen Geräten

Microsoft Office365 ist die führende Plattform bei Lumiforte, und Microsoft Teams ist der interne Standard für Kommunikation und Datenaustausch.'
    WHEN 'How do I get IT support at Lumiforte?' THEN 'IT-Support ist über folgende Kanäle verfügbar:

**Globaler Support (Niederländisch und Englisch):**
Verfügbar für alle Lumiforte-Kollegen weltweit:
- TCC Smart IT Solutions
- Telefon: +31 43 363 03 62
- E-Mail: support@tcc.eu

**Frankreich:**
- Kollegen können TCC kontaktieren (siehe oben)
- Zusätzlich können Sie auch AXE Informatique kontaktieren (www.axeinfo.fr)

**Häufige Support-Anfragen:**
- Erstellen von Teams oder Kanälen in Microsoft Teams: Kontaktieren Sie TCC per E-Mail
- Hinzufügen von Personen zu bestehenden Teams/Kanälen: Kontaktieren Sie TCC per E-Mail
- TCC kann vor der Bearbeitung eine Genehmigung von jemandem innerhalb von Lumiforte anfordern

Für spezifische Systeme:
- **Salesforce-Support**: Kontaktieren Sie Bas Moeskops
- **PowerBI-Berichte**: Kontaktieren Sie den Kollegen, der den spezifischen Bericht erstellt hat
- **QC/Produktionsberichte (Baarle-Nassau)**: Kontaktieren Sie Daan van Rijen
- **Finanz-/Verkaufsberichte**: Kontaktieren Sie Slava oder Rémi'
    WHEN 'Who is responsible for IT at Lumiforte?' THEN 'IT-Verantwortlichkeiten bei Lumiforte sind wie folgt aufgeteilt:

- **Globale IT**: Jeroen Vrieselaar
- **Lumiforte EMEA SAS**: Rémi Weber
- **Sport-lines GmbH**: Jort Gerritsen
- **Andere Entitäten**: Jeroen Vrieselaar

Neben diesen Hauptkontakten ist lokaler IT-Support an verschiedenen Standorten verfügbar, um bei alltäglichen IT-Problemen zu helfen.'
    WHEN 'What hardware standards does Lumiforte use?' THEN 'Lumiforte verwendet Microsoft Surface-Laptops als Standard-Hardware für Mitarbeiter, mit einigen Ausnahmen basierend auf spezifischen Stellenanforderungen. Alle Ausnahmen müssen von der globalen IT (Jeroen Vrieselaar oder Jort Gerritsen) genehmigt werden.

Wichtigste Punkte:
- Standardgerät: Microsoft Surface-Laptops
- Mobiltelefone für bestimmte Positionen
- Alle Geräte werden zentral über Microsoft Intune verwaltet
- Geräte enthalten eine ''Lumiforte-Software-Shell'' mit minimalen Anwendungen und Sicherheitsrichtlinien
- Defekte Hardware wird schnell abgeholt und ersetzt

Beim Austausch von Hardware muss alte Ausrüstung an den lokalen IT-Verantwortlichen für mögliche Wiederverwendung oder sichere Vernichtung zurückgegeben werden.'
    WHEN 'How do I set up my printer?' THEN 'So verbinden Sie sich mit einem Netzwerkdrucker:
1. Gehen Sie zu Einstellungen > Geräte > Drucker & Scanner (Windows) oder Systemeinstellungen > Drucker (Mac)
2. Klicken Sie auf "Drucker hinzufügen"
3. Wählen Sie den Drucker aus der Liste der verfügbaren Netzwerkdrucker aus
4. Installieren Sie bei Aufforderung die erforderlichen Treiber
5. Bei Bedarf als Standarddrucker festlegen

Wenn Sie den Drucker nicht finden können, notieren Sie sich den Namen/Standort des Druckers und wenden Sie sich an den IT-Support für Hilfe.'
    WHEN 'My computer won''t turn on. What should I do?' THEN 'Befolgen Sie diese Fehlerbehebungsschritte:
1. Überprüfen Sie, ob das Netzkabel ordnungsgemäß mit dem Computer und der Steckdose verbunden ist
2. Überprüfen Sie, ob die Steckdose funktioniert, indem Sie sie mit einem anderen Gerät testen
3. Wenn Sie einen Laptop verwenden, stellen Sie sicher, dass der Akku geladen ist oder schließen Sie das Netzteil an
4. Versuchen Sie bei Verfügbarkeit ein anderes Netzkabel
5. Achten Sie auf Pieptöne oder LED-Leuchten beim Drücken des Netzschalters

Wenn keiner dieser Schritte funktioniert, reichen Sie bitte ein Support-Ticket mit Details zu Ihren Beobachtungen ein.'
    WHEN 'My screen is frozen. What should I do?' THEN 'Wenn Ihr Bildschirm nicht reagiert:
1. Warten Sie 30 Sekunden, um zu sehen, ob das System sich erholt
2. Versuchen Sie, Strg+Alt+Entf (Windows) oder Befehl+Option+Esc (Mac) zu drücken
3. Schließen Sie die nicht reagierende Anwendung, wenn möglich
4. Wenn vollständig eingefroren, führen Sie einen Hard-Reset durch, indem Sie den Netzschalter 10 Sekunden lang gedrückt halten
5. Speichern Sie Ihre Arbeit nach dem Neustart häufig

Wenn dies regelmäßig auftritt, erstellen Sie ein Support-Ticket, da dies auf ein Hardware- oder Softwareproblem hinweisen kann.'
    WHEN 'How do I install software on my work computer?' THEN 'Software-Installationsrichtlinie:
1. Die meisten Softwareinstallationen erfordern Administratorrechte
2. Reichen Sie eine Anfrage über das IT-Support-Portal ein und geben Sie an:
   - Name der Software
   - Geschäftliche Rechtfertigung
   - Abteilungsgenehmigung (falls erforderlich)
3. Die IT wird die Anfrage auf Sicherheits- und Lizenzkonformität prüfen
4. Genehmigte Software wird von IT-Personal installiert
5. Laden Sie niemals Software aus inoffiziellen Quellen herunter

Diese Richtlinie hilft, Sicherheit und Software-Lizenzkonformität aufrechtzuerhalten.'
    WHEN 'How do I connect to the office Wi-Fi?' THEN 'So verbinden Sie sich mit dem Büro-WLAN-Netzwerk:
1. Öffnen Sie die WLAN-Einstellungen Ihres Geräts
2. Suchen Sie nach dem von der IT bereitgestellten Netzwerknamen (normalerweise der Firmenname)
3. Wählen Sie das Netzwerk aus und geben Sie das Passwort ein
4. Akzeptieren Sie bei Aufforderung Sicherheitszertifikate
5. Ihr Gerät sollte jetzt verbunden sein

Für Gast-WLAN-Zugang wenden Sie sich bitte an die Rezeption oder IT-Abteilung für temporäre Anmeldedaten.'
    WHEN 'How do I reset my password?' THEN 'So setzen Sie Ihr Passwort zurück:
1. Klicken Sie auf "Passwort vergessen" auf der Anmeldeseite
2. Geben Sie Ihre E-Mail-Adresse ein
3. Überprüfen Sie Ihre E-Mail auf einen Link zum Zurücksetzen des Passworts
4. Klicken Sie auf den Link und erstellen Sie ein neues Passwort
5. Stellen Sie sicher, dass Ihr neues Passwort mindestens 8 Zeichen lang ist und Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen enthält

Wenn Sie die E-Mail nicht innerhalb von 5 Minuten erhalten, überprüfen Sie Ihren Spam-Ordner oder wenden Sie sich an den IT-Support.'
    WHEN 'I can''t access my email. What should I do?' THEN 'Wenn Sie Probleme beim E-Mail-Zugriff haben:
1. Überprüfen Sie, ob Sie die richtige E-Mail-Adresse und das richtige Passwort verwenden
2. Überprüfen Sie Ihre Internetverbindung
3. Löschen Sie Ihren Browser-Cache und Cookies, wenn Sie Webmail verwenden
4. Versuchen Sie, von einem anderen Browser oder Gerät auf E-Mails zuzugreifen
5. Stellen Sie sicher, dass Ihr Konto nicht aufgrund mehrerer fehlgeschlagener Anmeldeversuche gesperrt wurde

Wenn Sie nach diesen Schritten immer noch nicht auf Ihre E-Mail zugreifen können, erstellen Sie bitte sofort ein Support-Ticket.'
    WHEN 'How do I report a security concern or phishing email?' THEN 'So melden Sie Sicherheitsbedenken:
1. Klicken Sie NICHT auf Links oder laden Sie keine Anhänge aus verdächtigen E-Mails herunter
2. Antworten Sie NICHT oder leiten Sie die verdächtige E-Mail NICHT weiter
3. Erstellen Sie ein dringendes Support-Ticket oder wenden Sie sich sofort an die IT
4. Wenn es sich um eine Phishing-E-Mail handelt, verwenden Sie die Schaltfläche "Phishing melden" in Ihrem E-Mail-Client
5. Löschen Sie die E-Mail erst, nachdem die IT informiert wurde

Häufige Phishing-Anzeichen:
- Anfragen nach Passwörtern oder persönlichen Informationen
- Dringende oder bedrohliche Sprache
- Verdächtige Absenderadressen
- Rechtschreib- und Grammatikfehler
- Unerwartete Anhänge oder Links'
    WHEN 'What is the password policy for company accounts?' THEN 'Passwortanforderungen des Unternehmens:
- Mindestens 8 Zeichen (12+ empfohlen)
- Muss Groß- und Kleinbuchstaben enthalten
- Muss mindestens eine Zahl enthalten
- Muss mindestens ein Sonderzeichen enthalten
- Kann die letzten 5 Passwörter nicht wiederverwenden
- Muss alle 90 Tage geändert werden
- Darf Ihren Namen oder Benutzernamen nicht enthalten

Tipps für sichere Passwörter:
- Verwenden Sie eine Passphrase mit zufälligen Wörtern
- Erwägen Sie die Verwendung eines Passwort-Managers
- Teilen Sie Ihr Passwort niemals mit jemandem
- Verwenden Sie unterschiedliche Passwörter für verschiedene Konten'
    WHEN 'How does the video intercom system work?' THEN 'Lumiforte verwendet ein Video-Gegensprechsystem am Eingang, das in Microsoft Teams integriert ist:

**Für Mitarbeiter:**
1. Halten Sie die Teams-App auf Computer und Telefon geöffnet
2. Wenn ein Besucher anruft, erhalten Sie einen Teams-Anruf (mit oder ohne Video)
3. Beantworten Sie den Anruf und geben Sie den Code **5111*** über die Teams-Tastatur (oben links) ein
4. Der Besucher hört den Summer und kann eintreten

**Vorbereitung auf Besucher:**
- Informieren Sie Besucher im Voraus, Sie direkt über die Gegensprechanlage anzurufen
- Besucher sollten die Option "Ich habe einen Termin mit…" auswählen
- Dadurch kann jeder seine eigenen Besucher behandeln, ohne andere zu stören

**Fragen oder Probleme:**
Kontaktieren Sie Kevin oder Carlo für praktische Hilfe bei der Teams-Integration oder beim Türöffnungsprozess.

Für detaillierte Anweisungen siehe das Video-Gegensprech-Handbuch im Dokumentenbereich.'
  END as content,
  CASE category
    WHEN 'Onboarding' THEN 'Onboarding'
    WHEN 'Software' THEN 'Software'
    WHEN 'Support' THEN 'Unterstützung'
    WHEN 'IT Management' THEN 'IT-Verwaltung'
    WHEN 'Hardware' THEN 'Hardware'
    WHEN 'Network' THEN 'Netzwerk'
    WHEN 'Password & Account' THEN 'Passwort & Konto'
    WHEN 'Email' THEN 'E-Mail'
    WHEN 'Security' THEN 'Sicherheit'
    WHEN 'Office' THEN 'Büro'
    WHEN 'Equipment' THEN 'Ausrüstung'
    ELSE category
  END as category,
  tags,
  'de' as language
FROM public.faq_articles
WHERE language = 'en';