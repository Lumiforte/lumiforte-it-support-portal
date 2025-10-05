import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  HelpCircle, 
  Ticket, 
  Home, 
  LogOut, 
  User, 
  Shield,
  Menu,
  Headset
} from "lucide-react";
import lumiforteLogo from "@/assets/lumiforte-logo.png";

const Layout = () => {
  const { profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-primary shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={lumiforteLogo} 
                alt="Lumiforte" 
                className="h-26 w-auto"
              />
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/">
                <Button
                  variant={isActive("/") ? "secondary" : "ghost"}
                  size="sm"
                  className={isActive("/") ? "" : "text-primary-foreground hover:text-primary-foreground hover:bg-primary/80"}
                >
                  <Home className="h-4 w-4 mr-2" />
                  {t("common.home")}
                </Button>
              </Link>
              <Link to="/faq">
                <Button
                  variant={isActive("/faq") ? "secondary" : "ghost"}
                  size="sm"
                  className={isActive("/faq") ? "" : "text-primary-foreground hover:text-primary-foreground hover:bg-primary/80"}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  {t("common.faq")}
                </Button>
              </Link>
              <Link to="/tickets">
                <Button
                  variant={isActive("/tickets") ? "secondary" : "ghost"}
                  size="sm"
                  className={isActive("/tickets") ? "" : "text-primary-foreground hover:text-primary-foreground hover:bg-primary/80"}
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  {t("common.tickets")}
                </Button>
              </Link>
              {(profile?.is_helpdesk || profile?.is_admin) && (
                <Link to="/helpdesk">
                  <Button
                    variant={isActive("/helpdesk") ? "secondary" : "ghost"}
                    size="sm"
                    className={isActive("/helpdesk") ? "" : "text-primary-foreground hover:text-primary-foreground hover:bg-primary/80"}
                  >
                    <Headset className="h-4 w-4 mr-2" />
                    {t("common.helpdesk")}
                  </Button>
                </Link>
              )}
              {profile?.is_admin && (
                <Link to="/admin">
                  <Button
                    variant={isActive("/admin") ? "secondary" : "ghost"}
                    size="sm"
                    className={isActive("/admin") ? "" : "text-primary-foreground hover:text-primary-foreground hover:bg-primary/80"}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary/80">
                  <User className="h-4 w-4 mr-2" />
                  {profile?.full_name || profile?.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t("common.myAccount")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {t("common.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="md:hidden" asChild>
                  <Link to="/" className="flex items-center">
                    <Home className="h-4 w-4 mr-2" />
                    {t("common.home")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="md:hidden" asChild>
                  <Link to="/faq" className="flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    {t("common.faq")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="md:hidden" asChild>
                  <Link to="/tickets" className="flex items-center">
                    <Ticket className="h-4 w-4 mr-2" />
                    {t("common.tickets")}
                  </Link>
                </DropdownMenuItem>
                {(profile?.is_helpdesk || profile?.is_admin) && (
                  <DropdownMenuItem className="md:hidden" asChild>
                    <Link to="/helpdesk" className="flex items-center">
                      <Headset className="h-4 w-4 mr-2" />
                      {t("common.helpdesk")}
                    </Link>
                  </DropdownMenuItem>
                )}
                {profile?.is_admin && (
                  <DropdownMenuItem className="md:hidden" asChild>
                    <Link to="/admin" className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("common.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Lumiforte Holding BV. {t("common.copyright")}</p>
          <p className="mt-2">{t("footer.systemDevelopment")}</p>
          <p className="mt-1">
            {t("footer.feedbackContact")}{" "}
            <a href="mailto:jeroen.vrieselaar@lumiforte.com" className="text-primary hover:underline">
              Jeroen Vrieselaar
            </a>.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
