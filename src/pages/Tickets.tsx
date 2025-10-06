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
import { formatDistanceToNow, format } from "date-fns";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  assigned_user?: {
    full_name: string | null;
    email: string;
  };
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
        .select(`
          *,
          assigned_user:profiles!tickets_assigned_to_fkey (
            full_name,
            email
          )
        `)
        .eq("created_by", user?.id)
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
    
    const getStatusDate = () => {
      if (ticket.status === 'closed' && ticket.closed_at) {
        return format(new Date(ticket.closed_at), 'dd-MM-yyyy HH:mm');
      }
      if (ticket.status === 'resolved' && ticket.resolved_at) {
        return format(new Date(ticket.resolved_at), 'dd-MM-yyyy HH:mm');
      }
      return null;
    };

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
            <div className="space-y-3">
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
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <span>Created:</span>
                  <span className="font-medium">{format(new Date(ticket.created_at), 'dd-MM-yyyy HH:mm')}</span>
                </div>
                
                {ticket.assigned_to && ticket.assigned_user && (
                  <div className="flex items-center gap-2">
                    <span>Assigned to:</span>
                    <span className="font-medium">{ticket.assigned_user.full_name || ticket.assigned_user.email}</span>
                  </div>
                )}
                
                {getStatusDate() && (
                  <div className="flex items-center gap-2">
                    <span>{ticket.status === 'closed' ? 'Closed' : 'Resolved'}:</span>
                    <span className="font-medium">{getStatusDate()}</span>
                  </div>
                )}
                
                {!ticket.assigned_to && (
                  <div className="flex items-center justify-between text-muted-foreground/70">
                    <span>Not yet assigned</span>
                  </div>
                )}
              </div>
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
            <p className="text-muted-foreground">Track and manage your support requests</p>
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
                      {activeTab === "all" ? "Create Your First Ticket" : "Create a Ticket"}
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
