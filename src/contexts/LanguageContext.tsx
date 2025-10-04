import { createContext, useContext, useState, ReactNode } from "react";

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
  const [language, setLanguage] = useState<Language>("en");

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
      },
      home: {
        title: "IT Support Portal",
        subtitle: "Welcome to the Lumiforte IT Support System",
        browseFaq: "Browse FAQ",
        browseFaqDesc: "Find answers to frequently asked questions about IT support",
        searchFaq: "Search FAQ",
        createTicket: "Create Ticket",
        createTicketDesc: "Need help? Submit a new support ticket and we'll assist you",
        newTicket: "New Ticket",
        myTickets: "My Tickets",
        myTicketsDesc: "View and track the status of your support requests",
        viewTickets: "View Tickets",
        documents: "Documents",
        documentsDesc: "Access important company documents and resources",
        viewDocuments: "View Documents",
        quickTips: "Quick Tips",
        quickTipsDesc: "Before submitting a ticket, try these quick solutions",
        checkFaqFirst: "Check FAQ First",
        checkFaqFirstDesc: "Most common issues are documented in our FAQ section with step-by-step solutions",
        restartFirst: "Restart First",
        restartFirstDesc: "Many technical issues can be resolved with a simple restart of your device.",
        askColleague: "Ask a Colleague",
        askColleagueDesc: "Check with your colleagues or manager if they experience the same issue. Often, you can help each other quickly.",
      },
      faq: {
        title: "Frequently Asked Questions",
        subtitle: "Search our knowledge base for quick answers to common IT questions",
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
      }
    }
  };

  return translations[lang];
};
