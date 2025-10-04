import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface Document {
  name: string;
  created_at: string;
  metadata: Record<string, any>;
}

// Hardcoded documents from public folder
const publicDocuments: Document[] = [
  {
    name: "instructions_video_intercom.pdf",
    created_at: new Date().toISOString(),
    metadata: { size: 0 }
  }
];

const Documents = () => {
  const [storageDocuments, setStorageDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .list("", {
          limit: 100,
          offset: 0,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) throw error;
      setStorageDocuments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Combine public documents with storage documents
  const documents = [...publicDocuments, ...storageDocuments];

  const getPublicUrl = (fileName: string) => {
    // Check if it's a public document
    if (publicDocuments.some(doc => doc.name === fileName)) {
      return `/documents/${fileName}`;
    }
    
    // Otherwise get from storage
    const { data } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatFileName = (fileName: string) => {
    // Special handling for video intercom
    if (fileName === "instructions_video_intercom.pdf") {
      return "Video Intercom Instructions";
    }
    return fileName.replace(/\.(pdf|docx?|xlsx?|pptx?)$/i, "").replace(/_/g, " ");
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
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">{t("documents.title")}</h1>
        <p className="text-muted-foreground">
          {t("documents.subtitle")}
        </p>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{t("documents.noDocuments")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {formatFileName(doc.name)}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {formatFileSize(doc.metadata?.size || 0)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  asChild
                >
                  <a
                    href={getPublicUrl(doc.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("documents.download")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;
