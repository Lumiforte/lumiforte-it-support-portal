import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Clock, CheckCircle, AlertCircle, XCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  assigned_to: string | null;
  profiles: {
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

const HelpdeskDashboard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (user && (profile?.is_admin || profile?.is_helpdesk)) {
      fetchAllTickets();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('helpdesk-tickets')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets'
          },
          () => {
            fetchAllTickets();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile]);

  const fetchAllTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          creator:profiles!tickets_created_by_fkey (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform data to match the Ticket interface
      const transformedData = (data || []).map(ticket => ({
        ...ticket,
        profiles: ticket.creator || { full_name: null, email: '' }
      }));
      
      setTickets(transformedData);
    } catch (error: any) {
      toast({
        title: t("common.error"),
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

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      open: t("tickets.statusOpen") || "Open",
      in_progress: t("tickets.statusInProgress") || "In Progress",
      resolved: t("tickets.statusResolved") || "Resolved",
      closed: t("tickets.statusClosed") || "Closed",
    };
    return statusMap[status] || status;
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
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{ticket.profiles?.full_name || ticket.profiles?.email}</span>
                </div>
              </div>
              <div className={`w-1 h-20 rounded-full ${priorityColors[ticket.priority as keyof typeof priorityColors]}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant={statusInfo?.variant}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {getStatusLabel(ticket.status)}
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
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">
          {t("helpdesk.title") || "Helpdesk Dashboard"}
        </h1>
        <p className="text-muted-foreground">
          {t("helpdesk.subtitle") || "View and manage all support tickets"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            {t("common.all") || "All"} ({tickets.length})
          </TabsTrigger>
          <TabsTrigger value="open">
            {getStatusLabel("open")} ({filterTickets("open").length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            {getStatusLabel("in_progress")} ({filterTickets("in_progress").length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            {getStatusLabel("resolved")} ({filterTickets("resolved").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filterTickets(activeTab === "all" ? "all" : activeTab).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {activeTab === "all" 
                    ? t("helpdesk.noTickets") || "No tickets found."
                    : `${t("common.no") || "No"} ${getStatusLabel(activeTab)} ${t("common.tickets") || "tickets"}.`}
                </p>
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

export default HelpdeskDashboard;
