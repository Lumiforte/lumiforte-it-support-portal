import { AIChat } from "@/components/AIChat";
import { useLanguage } from "@/contexts/LanguageContext";

const AIAssistant = () => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">{t("home.aiAssistant")}</h1>
        <p className="text-xl text-muted-foreground">
          {t("home.aiAssistantSubtitle")}
        </p>
      </div>

      <AIChat />
    </div>
  );
};

export default AIAssistant;
