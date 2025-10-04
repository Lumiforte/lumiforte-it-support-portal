import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

interface FAQ {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
}

const FAQ = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const nameToEmail: Record<string, string> = {
    "Kevin": "kevin.vanbeeck@lumiforte.com",
    "Kevin Vanbeeck": "kevin.vanbeeck@lumiforte.com",
    "Carlo": "carlo.reinacher@lumiforte.com",
    "Carlo Reinacher": "carlo.reinacher@lumiforte.com",
    "Bas Moeskops": "bas.moeskops@lumiforte.com",
    "Bas": "bas.moeskops@lumiforte.com",
    "Daan van Rijen": "daan.vanrijen@lumiforte.com",
    "Daan": "daan.vanrijen@lumiforte.com",
    "Jort Gerritsen": "jort.gerritsen@lumiforte.com",
    "Jort": "jort.gerritsen@lumiforte.com",
    "Slava": "slava.konizhevskiy@lumiforte.com",
    "Slava Konizhevskiy": "slava.konizhevskiy@lumiforte.com",
    "Rémi": "remi.weber@lumiforte.com",
    "Remi": "remi.weber@lumiforte.com",
    "Rémi Weber": "remi.weber@lumiforte.com",
    "Remi Weber": "remi.weber@lumiforte.com",
    "Jeroen Vrieselaar": "jeroen.vrieselaar@lumiforte.com",
    "Jeroen": "jeroen.vrieselaar@lumiforte.com",
    "Valérie Fornes": "valerie.fornes@lumiforte.com",
    "Valerie Fornes": "valerie.fornes@lumiforte.com",
    "Valérie": "valerie.fornes@lumiforte.com",
    "Valerie": "valerie.fornes@lumiforte.com",
  };

  useEffect(() => {
    fetchFAQs();
  }, [language]);

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from("faq_articles")
        .select("*")
        .eq("language", language)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const formattedFaqs = data.map((faq: any) => ({
        id: faq.id,
        title: faq.title,
        content: faq.content,
        tags: faq.tags || [],
        category: faq.category,
      }));
      
      setFaqs(formattedFaqs);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load FAQs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedFAQs = filteredFAQs.reduce((acc, faq) => {
    const category = faq.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const renderContentWithLinks = (content: string) => {
    const nameKeys = Object.keys(nameToEmail).sort((a, b) => b.length - a.length);
    const linkPattern = /\[Create a support ticket\]/gi;
    
    // Create pattern that matches names only as whole words (with word boundaries)
    const namePattern = new RegExp(`\\b(${nameKeys.map(escapeRegex).join("|")})\\b`, "gi");
    
    // Split by both link pattern and name pattern
    const combinedPattern = new RegExp(`(\\[Create a support ticket\\]|\\b(?:${nameKeys.map(escapeRegex).join("|")})\\b)`, "gi");
    const parts = content.split(combinedPattern);

    return (
      <span>
        {parts.filter(Boolean).map((part, i) => {
          const lower = part.toLowerCase();

          if (lower === "[create a support ticket]") {
            return (
              <Link
                key={`ticket-${i}`}
                to="/tickets/new"
                className="text-primary hover:underline font-medium inline-block"
              >
                Create a support ticket
              </Link>
            );
          }

          const matchedKey = nameKeys.find(
            (k) => k.toLowerCase() === lower
          );

          if (matchedKey) {
            const email = nameToEmail[matchedKey];
            return (
              <a
                key={`email-${i}`}
                href={`mailto:${email}`}
                className="text-primary hover:underline font-medium"
              >
                {part}
              </a>
            );
          }

          return part;
        })}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {(language === "nl" || language === "fr" || language === "de") && (
          <Alert className="bg-accent/20 border-accent">
            <Search className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {t("common.comingSoon")}
            </AlertDescription>
          </Alert>
        )}

        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">{t("faq.title")}</h1>
          <p className="text-muted-foreground">
            {t("faq.subtitle")}
          </p>
        </div>

        {language === "en" && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("faq.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

        {Object.keys(groupedFAQs).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{t("faq.noResults")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {category}
                    <Badge variant="secondary">{categoryFAQs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {categoryFAQs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left">
                          {faq.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <div className="text-muted-foreground whitespace-pre-line">
                              {renderContentWithLinks(faq.content)}
                            </div>
                            {faq.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {faq.tags.map((tag) => (
                                  <Badge key={tag} variant="outline">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </>
    )}
      </div>
  );
};

export default FAQ;
