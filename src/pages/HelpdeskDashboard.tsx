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
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  assigned_to: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  assigned_user?: {
    full_name: string | null;
    email: string;
    user_roles?: Array<{ role: string }>;
  };
  profiles: {
    full_name: string | null;
    email: string;
    user_roles?: Array<{ role: string }>;
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
  const [checkingUnassigned, setCheckingUnassigned] = useState(false);
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
            email,
            user_roles (role)
          ),
          assigned_user:profiles!tickets_assigned_to_fkey (
            full_name,
            email,
            user_roles (role)
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

  const getUserDisplayName = (user: { full_name: string | null; email: string; user_roles?: Array<{ role: string }> }) => {
    const name = user.full_name || user.email;
    const isHelpdesk = user.user_roles?.some(r => r.role === 'helpdesk');
    return isHelpdesk ? `${name} (Helpdesk)` : name;
  };

  const filterTickets = (status: string) => {
    if (status === "all") return tickets;
    return tickets.filter((ticket) => ticket.status === status);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      open: "Open",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
    };
    return statusMap[status] || status;
  };

  const checkUnassignedTickets = async () => {
    setCheckingUnassigned(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-unassigned-tickets");

      if (error) throw error;

      toast({
        title: "Check Complete",
        description: data.ticketsNotified > 0 
          ? `Notification sent for ${data.ticketsNotified} unassigned ticket(s)`
          : "No tickets require notification",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check unassigned tickets",
        variant: "destructive",
      });
    } finally {
      setCheckingUnassigned(false);
    }
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
    
    const daysOpen = differenceInDays(new Date(), new Date(ticket.created_at));
    
    // Calculate business days (Monday-Friday)
    const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
      let count = 0;
      const current = new Date(startDate);
      
      while (current <= endDate) {
        const dayOfWeek = current.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      
      return count;
    };
    
    const businessDaysOpen = calculateBusinessDays(new Date(ticket.created_at), new Date());
    
    const getDaysOpenStyle = () => {
      if (businessDaysOpen > 10) {
        return "bg-red-600 text-white px-2 py-0.5 rounded font-bold";
      } else if (businessDaysOpen > 3) {
        return "bg-yellow-400 text-black px-2 py-0.5 rounded font-bold";
      }
      return "font-medium text-foreground";
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
              <div className={`w-1 h-20 rounded-full ${priorityColors[ticket.priority as keyof typeof priorityColors]}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {getStatusLabel(ticket.status)}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`capitalize ${
                      ticket.priority === 'high' 
                        ? 'text-orange-600 font-bold border-orange-600' 
                        : ticket.priority === 'urgent'
                        ? 'bg-red-600 text-white font-bold border-red-600'
                        : ''
                    }`}
                  >
                    {ticket.priority}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {ticket.category}
                  </Badge>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <span>Submitted by:</span>
                  <span className="font-medium text-foreground">{getUserDisplayName(ticket.profiles)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span>Created:</span>
                  <span className="font-medium text-foreground">{format(new Date(ticket.created_at), 'dd-MM-yyyy HH:mm')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span>Days open:</span>
                  <span className={getDaysOpenStyle()}>{daysOpen} {daysOpen === 1 ? 'day' : 'days'}</span>
                </div>
                
                {ticket.assigned_to && ticket.assigned_user && (
                  <div className="flex items-center gap-2">
                    <span>Assigned to:</span>
                    <span className="font-medium text-foreground">{getUserDisplayName(ticket.assigned_user)}</span>
                  </div>
                )}
                
                {getStatusDate() && (
                  <div className="flex items-center gap-2">
                    <span>{ticket.status === 'closed' ? 'Closed' : 'Resolved'}:</span>
                    <span className="font-medium text-foreground">{getStatusDate()}</span>
                  </div>
                )}
                
                {!ticket.assigned_to && (
                  <div className="flex items-center gap-2">
                    <span className={businessDaysOpen > 2 ? "bg-red-600 text-white px-2 py-0.5 rounded font-bold" : "text-muted-foreground/70"}>
                      Not yet assigned
                    </span>
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
          <h1 className="text-3xl font-bold text-primary mb-2">
            {t("helpdesk.title") || "Helpdesk Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {t("helpdesk.subtitle") || "View and manage all support tickets"}
          </p>
        </div>
        <Button 
          onClick={checkUnassignedTickets}
          disabled={checkingUnassigned}
          variant="outline"
        >
          {checkingUnassigned ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            "Check Unassigned Tickets"
          )}
        </Button>
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
