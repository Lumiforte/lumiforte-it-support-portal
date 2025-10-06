import { AIChat } from "@/components/AIChat";

const AIAssistant = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">AI Assistent</h1>
        <p className="text-xl text-muted-foreground">
          Stel je vraag en ontvang direct antwoord
        </p>
      </div>

      <AIChat />
    </div>
  );
};

export default AIAssistant;
