-- Insert French translations for all English articles
INSERT INTO public.faq_articles (title, content, category, tags, language)
SELECT 
  CASE title
    WHEN 'How does IT onboarding work for new employees?' THEN 'Comment fonctionne l''intégration informatique pour les nouveaux employés ?'
    WHEN 'How do I request software licenses?' THEN 'Comment demander des licences logicielles ?'
    WHEN 'Where should I store my work files?' THEN 'Où dois-je stocker mes fichiers de travail ?'
    WHEN 'How do I get IT support at Lumiforte?' THEN 'Comment obtenir un support informatique chez Lumiforte ?'
    WHEN 'Who is responsible for IT at Lumiforte?' THEN 'Qui est responsable de l''informatique chez Lumiforte ?'
    WHEN 'What hardware standards does Lumiforte use?' THEN 'Quelles normes matérielles Lumiforte utilise-t-elle ?'
    WHEN 'How do I set up my printer?' THEN 'Comment configurer mon imprimante ?'
    WHEN 'My computer won''t turn on. What should I do?' THEN 'Mon ordinateur ne s''allume pas. Que dois-je faire ?'
    WHEN 'My screen is frozen. What should I do?' THEN 'Mon écran est gelé. Que dois-je faire ?'
    WHEN 'How do I install software on my work computer?' THEN 'Comment installer un logiciel sur mon ordinateur de travail ?'
    WHEN 'How do I connect to the office Wi-Fi?' THEN 'Comment me connecter au Wi-Fi du bureau ?'
    WHEN 'How do I reset my password?' THEN 'Comment réinitialiser mon mot de passe ?'
    WHEN 'I can''t access my email. What should I do?' THEN 'Je ne peux pas accéder à mon e-mail. Que dois-je faire ?'
    WHEN 'How do I report a security concern or phishing email?' THEN 'Comment signaler un problème de sécurité ou un e-mail de phishing ?'
    WHEN 'What is the password policy for company accounts?' THEN 'Quelle est la politique de mot de passe pour les comptes d''entreprise ?'
    WHEN 'How does the video intercom system work?' THEN 'Comment fonctionne le système d''interphone vidéo ?'
  END as title,
  CASE title
    WHEN 'How does IT onboarding work for new employees?' THEN 'L''intégration informatique est gérée différemment selon l''entité :

**Lumiforte EMEA SAS :**
- Organisé par Rémi Weber
- Déclenché par les RH

**Toutes les autres entités :**
- Organisé par Jeroen Vrieselaar
- Déclenché par les RH

**L''intégration informatique comprend :**
- Création de nouveaux comptes
- Ajout aux groupes et équipes appropriés
- Ajout aux boîtes aux lettres partagées
- Préparation du matériel (ordinateur portable, téléphone si applicable)
- Configuration de l''accès aux systèmes nécessaires

Les nouveaux employés doivent travailler avec les RH pour lancer ce processus.'
    WHEN 'How do I request software licenses?' THEN 'Pour demander une licence pour des produits logiciels (tels que PowerBI, ChatGPT ou CoPilot) :

1. Contactez votre responsable direct avec la demande
2. Votre responsable contactera Jeroen Vrieselaar pour les licences
3. L''informatique examinera la demande pour :
   - La conformité en matière de sécurité
   - Les exigences de licence
   - La justification commerciale

**Important** : Ne téléchargez jamais de logiciels provenant de sources non officielles. Cette politique aide à maintenir la sécurité et la conformité des licences logicielles.

Toutes les installations de logiciels nécessitent des privilèges d''administrateur et doivent passer par le processus de demande officiel.'
    WHEN 'Where should I store my work files?' THEN 'Toutes les données utilisateur doivent être stockées dans :
- **OneDrive** - pour les fichiers individuels
- **Microsoft Teams** - pour les fichiers d''équipe partagés

**Important** : Ne stockez jamais de fichiers uniquement sur votre ordinateur portable. Le stockage de fichiers dans le cloud garantit :
- Protection contre la perte de données due à une défaillance matérielle, un dysfonctionnement ou un vol
- Sauvegarde appropriée et sécurisée des données de l''entreprise
- Accès à vos fichiers depuis n''importe quel appareil
- Synchronisation automatique entre les appareils

Microsoft Office365 est la plateforme leader chez Lumiforte, et Microsoft Teams est la norme interne pour la communication et le partage de données.'
    WHEN 'How do I get IT support at Lumiforte?' THEN 'Le support informatique est disponible via les canaux suivants :

**Support Global (Néerlandais et Anglais) :**
Disponible pour tous les collègues Lumiforte dans le monde :
- TCC Smart IT Solutions
- Téléphone : +31 43 363 03 62
- E-mail : support@tcc.eu

**France :**
- Les collègues peuvent contacter TCC (voir ci-dessus)
- De plus, vous pouvez également contacter AXE Informatique (www.axeinfo.fr)

**Demandes de support courantes :**
- Création d''équipes ou de canaux dans Microsoft Teams : Contactez TCC par e-mail
- Ajout de personnes aux équipes/canaux existants : Contactez TCC par e-mail
- TCC peut demander l''approbation de quelqu''un au sein de Lumiforte avant d''agir

Pour des systèmes spécifiques :
- **Support Salesforce** : Contactez Bas Moeskops
- **Rapports PowerBI** : Contactez le collègue qui a créé le rapport spécifique
- **Rapports QC/Production (Baarle-Nassau)** : Contactez Daan van Rijen
- **Rapports financiers/ventes** : Contactez Slava ou Rémi'
    WHEN 'Who is responsible for IT at Lumiforte?' THEN 'Les responsabilités informatiques chez Lumiforte sont réparties comme suit :

- **IT Global** : Jeroen Vrieselaar
- **Lumiforte EMEA SAS** : Rémi Weber
- **Sport-lines GmbH** : Jort Gerritsen
- **Autres entités** : Jeroen Vrieselaar

En plus de ces contacts clés, un support informatique local est disponible dans divers emplacements pour aider avec les problèmes informatiques quotidiens.'
    WHEN 'What hardware standards does Lumiforte use?' THEN 'Lumiforte utilise des ordinateurs portables Microsoft Surface comme matériel standard pour les employés, avec quelques exceptions basées sur des exigences de poste spécifiques. Toute exception doit être approuvée par l''informatique globale (Jeroen Vrieselaar ou Jort Gerritsen).

Points clés :
- Appareil standard : Ordinateurs portables Microsoft Surface
- Téléphones mobiles fournis pour certaines fonctions
- Tous les appareils sont gérés de manière centralisée via Microsoft Intune
- Les appareils incluent un ''shell logiciel Lumiforte'' avec des applications minimales et des politiques de sécurité
- Le matériel défectueux est collecté et remplacé rapidement

Lors du remplacement du matériel, l''ancien équipement doit être retourné au responsable informatique local pour une réutilisation potentielle ou une destruction sécurisée.'
    WHEN 'How do I set up my printer?' THEN 'Pour vous connecter à une imprimante réseau :
1. Allez dans Paramètres > Périphériques > Imprimantes et scanners (Windows) ou Préférences Système > Imprimantes (Mac)
2. Cliquez sur "Ajouter une imprimante"
3. Sélectionnez l''imprimante dans la liste des imprimantes réseau disponibles
4. Si demandé, installez les pilotes nécessaires
5. Définissez comme imprimante par défaut si souhaité

Si vous ne trouvez pas l''imprimante, notez le nom/l''emplacement de l''imprimante et contactez le support informatique pour obtenir de l''aide.'
    WHEN 'My computer won''t turn on. What should I do?' THEN 'Suivez ces étapes de dépannage :
1. Vérifiez que le câble d''alimentation est correctement connecté à l''ordinateur et à la prise murale
2. Vérifiez que la prise fonctionne en la testant avec un autre appareil
3. Si vous utilisez un ordinateur portable, assurez-vous que la batterie est chargée ou connectez l''adaptateur secteur
4. Essayez un autre câble d''alimentation si disponible
5. Écoutez les bips ou recherchez les voyants LED lors de l''appui sur le bouton d''alimentation

Si aucune de ces étapes ne fonctionne, veuillez soumettre un ticket de support avec des détails sur ce que vous avez observé.'
    WHEN 'My screen is frozen. What should I do?' THEN 'Si votre écran ne répond pas :
1. Attendez 30 secondes pour voir si le système récupère
2. Essayez d''appuyer sur Ctrl+Alt+Suppr (Windows) ou Command+Option+Esc (Mac)
3. Fermez l''application qui ne répond pas si possible
4. Si complètement gelé, effectuez un redémarrage forcé en maintenant le bouton d''alimentation pendant 10 secondes
5. Après le redémarrage, enregistrez fréquemment votre travail

Si cela se produit régulièrement, créez un ticket de support car cela peut indiquer un problème matériel ou logiciel.'
    WHEN 'How do I install software on my work computer?' THEN 'Politique d''installation de logiciels :
1. La plupart des installations de logiciels nécessitent des privilèges d''administrateur
2. Soumettez une demande via le portail de support informatique en précisant :
   - Le nom du logiciel
   - La justification commerciale
   - L''approbation du département (si nécessaire)
3. L''informatique examinera la demande pour la conformité en matière de sécurité et de licence
4. Les logiciels approuvés seront installés par le personnel informatique
5. Ne téléchargez jamais de logiciels provenant de sources non officielles

Cette politique aide à maintenir la sécurité et la conformité des licences logicielles.'
    WHEN 'How do I connect to the office Wi-Fi?' THEN 'Pour vous connecter au réseau Wi-Fi du bureau :
1. Ouvrez les paramètres Wi-Fi de votre appareil
2. Recherchez le nom du réseau fourni par l''informatique (généralement le nom de l''entreprise)
3. Sélectionnez le réseau et entrez le mot de passe
4. Si demandé, acceptez les certificats de sécurité
5. Votre appareil devrait maintenant être connecté

Pour un accès Wi-Fi invité, veuillez contacter la réception ou le service informatique pour obtenir des identifiants temporaires.'
    WHEN 'How do I reset my password?' THEN 'Pour réinitialiser votre mot de passe :
1. Cliquez sur "Mot de passe oublié" sur la page de connexion
2. Entrez votre adresse e-mail
3. Vérifiez votre e-mail pour un lien de réinitialisation de mot de passe
4. Cliquez sur le lien et créez un nouveau mot de passe
5. Assurez-vous que votre nouveau mot de passe comporte au moins 8 caractères et inclut des majuscules, des minuscules, des chiffres et des caractères spéciaux

Si vous ne recevez pas l''e-mail dans les 5 minutes, vérifiez votre dossier spam ou contactez le support informatique.'
    WHEN 'I can''t access my email. What should I do?' THEN 'Si vous rencontrez des problèmes d''accès à votre e-mail :
1. Vérifiez que vous utilisez la bonne adresse e-mail et le bon mot de passe
2. Vérifiez votre connexion Internet
3. Effacez le cache et les cookies de votre navigateur si vous utilisez le webmail
4. Essayez d''accéder à l''e-mail depuis un autre navigateur ou appareil
5. Assurez-vous que votre compte n''a pas été verrouillé en raison de plusieurs tentatives de connexion infructueuses

Si vous ne parvenez toujours pas à accéder à votre e-mail après ces étapes, veuillez créer immédiatement un ticket de support.'
    WHEN 'How do I report a security concern or phishing email?' THEN 'Pour signaler des problèmes de sécurité :
1. NE CLIQUEZ PAS sur les liens ou ne téléchargez pas les pièces jointes des e-mails suspects
2. NE RÉPONDEZ PAS ou ne transférez pas l''e-mail suspect
3. Créez un ticket de support urgent ou contactez immédiatement l''informatique
4. S''il s''agit d''un e-mail de phishing, utilisez le bouton "Signaler le phishing" dans votre client de messagerie
5. Supprimez l''e-mail uniquement après que l''informatique ait été informée

Signes courants de phishing :
- Demandes de mots de passe ou d''informations personnelles
- Langage urgent ou menaçant
- Adresses d''expéditeur suspectes
- Fautes d''orthographe et de grammaire
- Pièces jointes ou liens inattendus'
    WHEN 'What is the password policy for company accounts?' THEN 'Exigences de mot de passe de l''entreprise :
- Minimum 8 caractères (12+ recommandé)
- Doit inclure des majuscules et des minuscules
- Doit inclure au moins un chiffre
- Doit inclure au moins un caractère spécial
- Ne peut pas réutiliser les 5 derniers mots de passe
- Doit être changé tous les 90 jours
- Ne peut pas contenir votre nom ou nom d''utilisateur

Conseils pour des mots de passe forts :
- Utilisez une phrase de passe avec des mots aléatoires
- Envisagez d''utiliser un gestionnaire de mots de passe
- Ne partagez jamais votre mot de passe avec quiconque
- Utilisez des mots de passe différents pour différents comptes'
    WHEN 'How does the video intercom system work?' THEN 'Lumiforte utilise un système d''interphone vidéo à l''entrée qui s''intègre à Microsoft Teams :

**Pour les employés :**
1. Gardez l''application Teams ouverte sur l''ordinateur et le téléphone
2. Lorsqu''un visiteur appelle, vous recevrez un appel Teams (avec ou sans vidéo)
3. Répondez à l''appel et entrez le code **5111*** via le clavier Teams (en haut à gauche)
4. Le visiteur entendra le buzzer et pourra entrer

**Préparation des visiteurs :**
- Informez les visiteurs à l''avance de vous appeler directement via l''interphone
- Les visiteurs doivent sélectionner l''option "J''ai un rendez-vous avec…"
- Cela permet à chacun de gérer ses propres visiteurs sans déranger les autres

**Questions ou problèmes :**
Contactez Kevin ou Carlo pour une assistance pratique avec l''intégration Teams ou le processus d''ouverture de la porte.

Pour des instructions détaillées, consultez le manuel de l''interphone vidéo disponible dans la section documents.'
  END as content,
  CASE category
    WHEN 'Onboarding' THEN 'Intégration'
    WHEN 'Software' THEN 'Logiciel'
    WHEN 'Support' THEN 'Support'
    WHEN 'IT Management' THEN 'Gestion IT'
    WHEN 'Hardware' THEN 'Matériel'
    WHEN 'Network' THEN 'Réseau'
    WHEN 'Password & Account' THEN 'Mot de passe & Compte'
    WHEN 'Email' THEN 'E-mail'
    WHEN 'Security' THEN 'Sécurité'
    WHEN 'Office' THEN 'Bureau'
    WHEN 'Equipment' THEN 'Équipement'
    ELSE category
  END as category,
  tags,
  'fr' as language
FROM public.faq_articles
WHERE language = 'en';