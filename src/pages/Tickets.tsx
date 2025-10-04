import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  open: { label: "Open", icon: Clock, variant: "default" as const },
  in_progress: { label: "In Progress", icon: AlertCircle, variant: "secondary" as const },
  resolved: { label: "Resolved", icon: CheckCircle, variant: "outline" as const },
  closed: { label: "Closed", icon: XCircle, variant: "outline" as const },
};

const priorityColors = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const Tickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = (status: string) => {
    if (status === "all") return tickets;
    return tickets.filter((ticket) => ticket.status === status);
  };

  const TicketCard = ({ ticket }: { ticket: Ticket }) => {
    const statusInfo = statusConfig[ticket.status as keyof typeof statusConfig];
    const StatusIcon = statusInfo?.icon || Clock;

    return (
      <Link to={`/tickets/${ticket.id}`}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg mb-2 truncate">{ticket.title}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
              </div>
              <div className={`w-1 h-16 rounded-full ${priorityColors[ticket.priority as keyof typeof priorityColors]}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant={statusInfo?.variant}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo?.label}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {ticket.priority}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">My Support Tickets</h1>
            <p className="text-muted-foreground">Track and manage your IT support requests</p>
          </div>
          <Link to="/tickets/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All ({tickets.length})
            </TabsTrigger>
            <TabsTrigger value="open">
              Open ({filterTickets("open").length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({filterTickets("in_progress").length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({filterTickets("resolved").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filterTickets(activeTab === "all" ? "all" : activeTab).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    {activeTab === "all" 
                      ? "You haven't created any tickets yet."
                      : `No ${activeTab.replace("_", " ")} tickets.`}
                  </p>
                  <Link to="/tickets/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Ticket
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filterTickets(activeTab === "all" ? "all" : activeTab).map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default Tickets;
