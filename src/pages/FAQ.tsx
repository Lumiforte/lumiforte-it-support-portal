import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from("faq_articles")
        .select("*")
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Search our knowledge base for quick answers to common IT questions
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {Object.keys(groupedFAQs).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No FAQs found matching your search.</p>
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
                            <p className="text-muted-foreground whitespace-pre-line">{faq.content}</p>
                            {faq.title === "How does the video intercom work?" && (
                              <a 
                                href="/documents/instructions_video_intercom.pdf" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                              >
                                📄 Download Video Intercom Instructions (PDF)
                              </a>
                            )}
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
      </div>
  );
};

export default FAQ;
