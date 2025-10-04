import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Ticket, Plus, Search, Clock, CheckCircle, FileText, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">IT Support Portal</h1>
          <p className="text-xl text-muted-foreground">
            Welcome to the Lumiforte IT Support System
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-secondary rounded-lg">
                  <HelpCircle className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>Browse FAQ</CardTitle>
              </div>
              <CardDescription>
                Find answers to frequently asked questions about IT support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/faq">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Search className="mr-2 h-4 w-4" />
                  Search FAQ
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
                <CardTitle>Create Ticket</CardTitle>
              </div>
              <CardDescription>
                Need help? Submit a new support ticket and we'll assist you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/tickets/new">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Plus className="mr-2 h-4 w-4" />
                  New Ticket
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
                <CardTitle>My Tickets</CardTitle>
              </div>
              <CardDescription>
                View and track the status of your support requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/tickets">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Ticket className="mr-2 h-4 w-4" />
                  View Tickets
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
                <CardTitle>Documents</CardTitle>
              </div>
              <CardDescription>
                Access important company documents and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/documents">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <FileText className="mr-2 h-4 w-4" />
                  View Documents
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
            <CardDescription>Before submitting a ticket, try these quick solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-3">
                <div className="p-2 h-fit bg-secondary rounded-lg">
                  <Clock className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Check FAQ First</h4>
                  <p className="text-sm text-muted-foreground">
                    Most common issues are documented in our <Link to="/faq" className="text-primary hover:underline font-medium">FAQ section</Link> with step-by-step solutions.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2 h-fit bg-secondary rounded-lg">
                  <CheckCircle className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Restart First</h4>
                  <p className="text-sm text-muted-foreground">
                    Many technical issues can be resolved with a simple restart of your device.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2 h-fit bg-secondary rounded-lg">
                  <Users className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Ask a Colleague</h4>
                  <p className="text-sm text-muted-foreground">
                    Check with your colleagues or manager if they experience the same issue. Often, you can help each other quickly.
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
