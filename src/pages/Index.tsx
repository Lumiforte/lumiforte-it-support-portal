import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Ticket, Plus, Search, Clock, CheckCircle, FileText, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">{t("home.title")}</h1>
          <p className="text-xl text-muted-foreground">
            {t("home.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-secondary rounded-lg">
                  <HelpCircle className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>{t("home.browseFaq")}</CardTitle>
              </div>
              <CardDescription>
                {t("home.browseFaqDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/faq">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Search className="mr-2 h-4 w-4" />
                  {t("home.searchFaq")}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-secondary rounded-lg">
                  <Plus className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>{t("home.createTicket")}</CardTitle>
              </div>
              <CardDescription>
                {t("home.createTicketDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/tickets/new">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("home.newTicket")}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-secondary rounded-lg">
                  <Ticket className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>{t("home.myTickets")}</CardTitle>
              </div>
              <CardDescription>
                {t("home.myTicketsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/tickets">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Ticket className="mr-2 h-4 w-4" />
                  {t("home.viewTickets")}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-secondary rounded-lg">
                  <FileText className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>{t("home.documents")}</CardTitle>
              </div>
              <CardDescription>
                {t("home.documentsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/documents">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <FileText className="mr-2 h-4 w-4" />
                  {t("home.viewDocuments")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("home.quickTips")}</CardTitle>
            <CardDescription>{t("home.quickTipsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-3">
                <div className="p-2 h-fit bg-secondary rounded-lg">
                  <Clock className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t("home.checkFaqFirst")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t("home.checkFaqFirstDesc").split("FAQ section").map((part, i, arr) => 
                      i < arr.length - 1 ? (
                        <span key={i}>
                          {part}
                          <Link to="/faq" className="text-primary hover:underline font-medium">
                            {t("common.faq")} section
                          </Link>
                        </span>
                      ) : part
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2 h-fit bg-secondary rounded-lg">
                  <CheckCircle className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t("home.restartFirst")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t("home.restartFirstDesc")}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2 h-fit bg-secondary rounded-lg">
                  <Users className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{t("home.askColleague")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t("home.askColleagueDesc")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default Index;
