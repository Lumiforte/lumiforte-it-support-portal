import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  Menu
} from "lucide-react";
import lumiforteLogo from "@/assets/lumiforte-logo.png";

const Layout = () => {
  const { profile, signOut } = useAuth();
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
                className="h-8 w-auto"
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
                  Home
                </Button>
              </Link>
              <Link to="/faq">
                <Button
                  variant={isActive("/faq") ? "secondary" : "ghost"}
                  size="sm"
                  className={isActive("/faq") ? "" : "text-primary-foreground hover:text-primary-foreground hover:bg-primary/80"}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  FAQ
                </Button>
              </Link>
              <Link to="/tickets">
                <Button
                  variant={isActive("/tickets") ? "secondary" : "ghost"}
                  size="sm"
                  className={isActive("/tickets") ? "" : "text-primary-foreground hover:text-primary-foreground hover:bg-primary/80"}
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  My Tickets
                </Button>
              </Link>
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

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary/80">
                  <User className="h-4 w-4 mr-2" />
                  {profile?.full_name || profile?.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="md:hidden" asChild>
                  <Link to="/" className="flex items-center">
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="md:hidden" asChild>
                  <Link to="/faq" className="flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    FAQ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="md:hidden" asChild>
                  <Link to="/tickets" className="flex items-center">
                    <Ticket className="h-4 w-4 mr-2" />
                    My Tickets
                  </Link>
                </DropdownMenuItem>
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
                  Sign Out
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
          © {new Date().getFullYear()} Lumiforte. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
