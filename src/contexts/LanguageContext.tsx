import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type Language = "en" | "nl" | "fr" | "de";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load user's preferred language from profile
    const loadUserLanguage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("id", user.id)
          .single();
        
        if (profile?.preferred_language) {
          setLanguageState(profile.preferred_language as Language);
        }
      }
      setIsLoaded(true);
    };

    loadUserLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    
    // Save to user profile if logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ preferred_language: lang })
        .eq("id", user.id);
    }
  };

  const t = (key: string): string => {
    const translations = getTranslations(language);
    const keys = key.split(".");
    let value: any = translations;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const getTranslations = (lang: Language) => {
  const translations = {
    en: {
      common: {
        home: "Home",
        faq: "FAQ",
        documents: "Documents",
        tickets: "My Tickets",
        signOut: "Sign Out",
        myAccount: "My Account",
        language: "Language",
        copyright: "All rights reserved",
        profile: "Profile",
        helpdesk: "Helpdesk",
        all: "All",
        no: "No",
        error: "Error",
      },
      profile: {
        title: "My Profile",
        subtitle: "Manage your personal information",
      fullName: "Full Name",
      email: "Email Address",
      phoneNumber: "Phone Number",
      phoneNumberPlaceholder: "+31 6 12345678",
      save: "Save Changes",
      saving: "Saving...",
      successMessage: "Profile updated successfully",
      errorMessage: "Failed to update profile",
      language: "Preferred Language",
      languageDescription: "Your language preference will be saved and applied automatically when you sign in",
    },
      helpdesk: {
        title: "Helpdesk Dashboard",
        subtitle: "View and manage all support tickets",
        noTickets: "No tickets found.",
      },
      home: {
        title: "Welcome to Lumiforte Support",
        subtitle: "How can we help you today?",
        browseFaq: "Browse FAQ",
        browseFaqDesc: "Find answers to common questions",
        searchFaq: "Search FAQ",
        createTicket: "Create Ticket",
        createTicketDesc: "Need help? Create a support ticket",
        newTicket: "New Ticket",
        myTickets: "My Tickets",
        myTicketsDesc: "View and manage your support requests",
        viewTickets: "View Tickets",
        aiAssistant: "AI Assistant",
        aiAssistantDesc: "Ask our AI assistant directly",
        aiAssistantSubtitle: "Ask your question and get an instant answer",
        startChat: "Start Chat",
        quickTips: "Quick Tips",
        quickTipsDesc: "Before creating a ticket, try these helpful tips",
        checkFaqFirst: "Check FAQ First",
        checkFaqFirstDesc: "Many common issues are already answered in our FAQ section",
        restartFirst: "Restart First",
        restartFirstDesc: "Try restarting your device or logging out and back in",
        askColleague: "Ask a Colleague",
        askColleagueDesc: "Your team members might have encountered similar issues",
      },
      faq: {
        title: "Frequently Asked Questions",
        subtitle: "Search our knowledge base for quick answers to common questions",
        searchPlaceholder: "Search FAQs...",
        noResults: "No FAQs found matching your search.",
      },
      documents: {
        title: "Documents",
        subtitle: "Access important company documents and resources",
        noDocuments: "No documents available yet.",
        download: "Download",
      },
      footer: {
        systemDevelopment: "This system is under development and not yet complete. Responses may be incorrect.",
        feedbackContact: "If you have feedback or would like to contribute to this portal, please contact",
        languageNote: "", // No note for English
      }
    },
    nl: {
      common: {
        home: "Home",
        faq: "FAQ",
        documents: "Documenten",
        tickets: "Mijn Tickets",
        signOut: "Uitloggen",
        myAccount: "Mijn Account",
        language: "Taal",
        copyright: "Alle rechten voorbehouden",
        comingSoon: "Nederlandse versie komt binnenkort beschikbaar. Gebruik voorlopig de Engelse versie.",
        profile: "Profiel",
        helpdesk: "Helpdesk",
        all: "Alle",
        no: "Geen",
        error: "Fout",
      },
      profile: {
        title: "Mijn Profiel",
        subtitle: "Beheer uw persoonlijke gegevens",
      fullName: "Volledige Naam",
      email: "E-mailadres",
      phoneNumber: "Telefoonnummer",
      phoneNumberPlaceholder: "+31 6 12345678",
      save: "Wijzigingen Opslaan",
      saving: "Opslaan...",
      successMessage: "Profiel succesvol bijgewerkt",
      errorMessage: "Profiel bijwerken mislukt",
      language: "Voorkeurstaal",
      languageDescription: "Uw taalvoorkeur wordt opgeslagen en automatisch toegepast wanneer u inlogt",
    },
      helpdesk: {
        title: "Helpdesk Dashboard",
        subtitle: "Bekijk en beheer alle supporttickets",
        noTickets: "Geen tickets gevonden.",
      },
      home: {
        title: "IT Ondersteuningsportaal",
        subtitle: "Welkom bij het Lumiforte IT Ondersteuningssysteem",
        browseFaq: "Bekijk FAQ",
        browseFaqDesc: "Vind antwoorden op veelgestelde vragen over IT-ondersteuning",
        searchFaq: "Zoek FAQ",
        createTicket: "Ticket Aanmaken",
        createTicketDesc: "Hulp nodig? Dien een nieuw ondersteuningsticket in en wij helpen u",
        newTicket: "Nieuw Ticket",
        myTickets: "Mijn Tickets",
        myTicketsDesc: "Bekijk en volg de status van uw ondersteuningsverzoeken",
        viewTickets: "Bekijk Tickets",
        documents: "Documenten",
        documentsDesc: "Toegang tot belangrijke bedrijfsdocumenten en bronnen",
        viewDocuments: "Bekijk Documenten",
        quickTips: "Snelle Tips",
        quickTipsDesc: "Probeer deze snelle oplossingen voordat u een ticket indient",
        checkFaqFirst: "Controleer eerst de FAQ",
        checkFaqFirstDesc: "De meeste voorkomende problemen zijn gedocumenteerd in onze FAQ-sectie met stapsgewijze oplossingen",
        restartFirst: "Eerst opnieuw opstarten",
        restartFirstDesc: "Veel technische problemen kunnen worden opgelost door uw apparaat opnieuw op te starten.",
        askColleague: "Vraag een collega",
        askColleagueDesc: "Check bij uw collega's of leidinggevende of zij hetzelfde probleem ervaren. Vaak kunt u elkaar snel helpen.",
      },
      faq: {
        title: "Veelgestelde Vragen",
        subtitle: "Doorzoek onze kennisbank voor snelle antwoorden op veelvoorkomende IT-vragen",
        searchPlaceholder: "Zoek FAQ's...",
        noResults: "Geen FAQ's gevonden die overeenkomen met uw zoekopdracht.",
      },
      documents: {
        title: "Documenten",
        subtitle: "Toegang tot belangrijke bedrijfsdocumenten en bronnen",
        noDocuments: "Nog geen documenten beschikbaar.",
        download: "Download",
      },
      footer: {
        systemDevelopment: "Dit systeem is in ontwikkeling en nog niet compleet. Reacties kunnen onjuist zijn.",
        feedbackContact: "Als u feedback heeft of wilt bijdragen aan dit portaal, neem dan contact op met",
        languageNote: "", // No note for Dutch
      }
    },
    fr: {
      common: {
        home: "Accueil",
        faq: "FAQ",
        documents: "Documents",
        tickets: "Mes Tickets",
        signOut: "Déconnexion",
        myAccount: "Mon Compte",
        language: "Langue",
        copyright: "Tous droits réservés",
        comingSoon: "La version française sera bientôt disponible. Veuillez utiliser la version anglaise pour le moment.",
        profile: "Profil",
        helpdesk: "Service d'assistance",
        all: "Tout",
        no: "Aucun",
        error: "Erreur",
      },
      profile: {
        title: "Mon Profil",
        subtitle: "Gérez vos informations personnelles",
      fullName: "Nom Complet",
      email: "Adresse E-mail",
      phoneNumber: "Numéro de Téléphone",
      phoneNumberPlaceholder: "+33 6 12 34 56 78",
      save: "Enregistrer les Modifications",
      saving: "Enregistrement...",
      successMessage: "Profil mis à jour avec succès",
      errorMessage: "Échec de la mise à jour du profil",
      language: "Langue Préférée",
      languageDescription: "Votre préférence linguistique sera enregistrée et appliquée automatiquement lorsque vous vous connectez",
    },
      helpdesk: {
        title: "Tableau de bord Service d'assistance",
        subtitle: "Voir et gérer tous les tickets d'assistance",
        noTickets: "Aucun ticket trouvé.",
      },
      home: {
        title: "Portail d'Assistance IT",
        subtitle: "Bienvenue sur le système d'assistance IT de Lumiforte",
        browseFaq: "Parcourir la FAQ",
        browseFaqDesc: "Trouvez des réponses aux questions fréquemment posées sur l'assistance IT",
        searchFaq: "Rechercher FAQ",
        createTicket: "Créer un Ticket",
        createTicketDesc: "Besoin d'aide? Soumettez un nouveau ticket d'assistance et nous vous aiderons",
        newTicket: "Nouveau Ticket",
        myTickets: "Mes Tickets",
        myTicketsDesc: "Consultez et suivez l'état de vos demandes d'assistance",
        viewTickets: "Voir les Tickets",
        documents: "Documents",
        documentsDesc: "Accédez aux documents et ressources importants de l'entreprise",
        viewDocuments: "Voir les Documents",
        quickTips: "Conseils Rapides",
        quickTipsDesc: "Avant de soumettre un ticket, essayez ces solutions rapides",
        checkFaqFirst: "Vérifiez d'abord la FAQ",
        checkFaqFirstDesc: "La plupart des problèmes courants sont documentés dans notre section FAQ avec des solutions étape par étape",
        restartFirst: "Redémarrez d'abord",
        restartFirstDesc: "De nombreux problèmes techniques peuvent être résolus par un simple redémarrage de votre appareil.",
        askColleague: "Demandez à un collègue",
        askColleagueDesc: "Vérifiez auprès de vos collègues ou de votre responsable s'ils rencontrent le même problème. Souvent, vous pouvez vous entraider rapidement.",
      },
      faq: {
        title: "Questions Fréquemment Posées",
        subtitle: "Recherchez dans notre base de connaissances des réponses rapides aux questions IT courantes",
        searchPlaceholder: "Rechercher dans les FAQ...",
        noResults: "Aucune FAQ trouvée correspondant à votre recherche.",
      },
      documents: {
        title: "Documents",
        subtitle: "Accédez aux documents et ressources importants de l'entreprise",
        noDocuments: "Aucun document disponible pour le moment.",
        download: "Télécharger",
      },
      footer: {
        systemDevelopment: "Ce système est en cours de développement et n'est pas encore complet. Les réponses peuvent être incorrectes.",
        feedbackContact: "Si vous avez des commentaires ou souhaitez contribuer à ce portail, veuillez contacter",
        languageNote: "📝 Note importante : Lors de la création d'un ticket de support, veuillez rédiger votre demande en anglais afin que notre équipe d'assistance puisse traiter votre demande efficacement.",
      }
    },
    de: {
      common: {
        home: "Startseite",
        faq: "FAQ",
        documents: "Dokumente",
        tickets: "Meine Tickets",
        signOut: "Abmelden",
        myAccount: "Mein Konto",
        language: "Sprache",
        copyright: "Alle Rechte vorbehalten",
        comingSoon: "Deutsche Version in Kürze verfügbar. Bitte verwenden Sie vorerst die englische Version.",
        profile: "Profil",
        helpdesk: "Helpdesk",
        all: "Alle",
        no: "Keine",
        error: "Fehler",
      },
      profile: {
        title: "Mein Profil",
        subtitle: "Verwalten Sie Ihre persönlichen Informationen",
      fullName: "Vollständiger Name",
      email: "E-Mail-Adresse",
      phoneNumber: "Telefonnummer",
      phoneNumberPlaceholder: "+49 151 12345678",
      save: "Änderungen Speichern",
      saving: "Speichern...",
      successMessage: "Profil erfolgreich aktualisiert",
      errorMessage: "Profil konnte nicht aktualisiert werden",
      language: "Bevorzugte Sprache",
      languageDescription: "Ihre Spracheinstellung wird gespeichert und automatisch angewendet, wenn Sie sich anmelden",
    },
      helpdesk: {
        title: "Helpdesk Dashboard",
        subtitle: "Alle Support-Tickets anzeigen und verwalten",
        noTickets: "Keine Tickets gefunden.",
      },
      home: {
        title: "IT-Support-Portal",
        subtitle: "Willkommen beim Lumiforte IT-Support-System",
        browseFaq: "FAQ durchsuchen",
        browseFaqDesc: "Finden Sie Antworten auf häufig gestellte Fragen zum IT-Support",
        searchFaq: "FAQ durchsuchen",
        createTicket: "Ticket erstellen",
        createTicketDesc: "Brauchen Sie Hilfe? Reichen Sie ein neues Support-Ticket ein und wir helfen Ihnen",
        newTicket: "Neues Ticket",
        myTickets: "Meine Tickets",
        myTicketsDesc: "Zeigen Sie den Status Ihrer Support-Anfragen an und verfolgen Sie ihn",
        viewTickets: "Tickets anzeigen",
        documents: "Dokumente",
        documentsDesc: "Zugriff auf wichtige Unternehmensdokumente und Ressourcen",
        viewDocuments: "Dokumente anzeigen",
        quickTips: "Schnelle Tipps",
        quickTipsDesc: "Bevor Sie ein Ticket einreichen, probieren Sie diese schnellen Lösungen",
        checkFaqFirst: "Überprüfen Sie zuerst die FAQ",
        checkFaqFirstDesc: "Die häufigsten Probleme sind in unserem FAQ-Bereich mit schrittweisen Lösungen dokumentiert",
        restartFirst: "Zuerst neu starten",
        restartFirstDesc: "Viele technische Probleme können durch einen einfachen Neustart Ihres Geräts behoben werden.",
        askColleague: "Fragen Sie einen Kollegen",
        askColleagueDesc: "Fragen Sie Ihre Kollegen oder Ihren Vorgesetzten, ob sie dasselbe Problem haben. Oft können Sie sich gegenseitig schnell helfen.",
      },
      faq: {
        title: "Häufig gestellte Fragen",
        subtitle: "Durchsuchen Sie unsere Wissensdatenbank nach schnellen Antworten auf häufige IT-Fragen",
        searchPlaceholder: "FAQs durchsuchen...",
        noResults: "Keine FAQs gefunden, die Ihrer Suche entsprechen.",
      },
      documents: {
        title: "Dokumente",
        subtitle: "Zugriff auf wichtige Unternehmensdokumente und Ressourcen",
        noDocuments: "Noch keine Dokumente verfügbar.",
        download: "Herunterladen",
      },
      footer: {
        systemDevelopment: "Dieses System befindet sich in der Entwicklung und ist noch nicht vollständig. Antworten können falsch sein.",
        feedbackContact: "Wenn Sie Feedback haben oder zu diesem Portal beitragen möchten, kontaktieren Sie bitte",
        languageNote: "📝 Wichtiger Hinweis: Bei der Erstellung eines Support-Tickets schreiben Sie Ihre Anfrage jedoch bitte auf Englisch, damit unser Support-Team Ihre Anfrage effektiv bearbeiten kann.",
      }
    }
  };

  return translations[lang];
};
