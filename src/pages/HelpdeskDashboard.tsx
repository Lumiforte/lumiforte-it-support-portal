import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clock, CheckCircle, AlertCircle, XCircle, User, ArrowUpDown, Filter } from "lucide-react";
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
  const [sortBy, setSortBy] = useState<"created" | "status" | "daysOpen">("created");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
    let filtered = tickets;
    
    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === status);
    }
    
    return filtered;
  };
  
  const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
    let count = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  };
  
  const sortTickets = (ticketsToSort: Ticket[]) => {
    return [...ticketsToSort].sort((a, b) => {
      if (sortBy === "status") {
        const statusOrder = { open: 0, in_progress: 1, resolved: 2, closed: 3 };
        return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      } else if (sortBy === "daysOpen") {
        const aDays = calculateBusinessDays(new Date(a.created_at), new Date());
        const bDays = calculateBusinessDays(new Date(b.created_at), new Date());
        return bDays - aDays; // Descending order
      }
      // Default: sort by created_at (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
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

  const TicketRow = ({ ticket, index }: { ticket: Ticket; index: number }) => {
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
        <div className={`grid grid-cols-12 gap-3 p-3 hover:shadow-md transition-shadow cursor-pointer border-b ${
          index % 2 === 0 ? 'bg-background' : 'bg-accent/10'
        }`}>
          {/* Priority indicator */}
          <div className="col-span-12 md:col-span-1 flex md:justify-center items-center">
            <div className={`w-3 h-3 rounded-full ${priorityColors[ticket.priority as keyof typeof priorityColors]}`} title={ticket.priority} />
          </div>
          
          {/* Title & Description */}
          <div className="col-span-12 md:col-span-4">
            <div className="font-semibold text-sm truncate mb-1">{ticket.title}</div>
            <div className="text-xs text-muted-foreground line-clamp-1">{ticket.description}</div>
          </div>
          
          {/* Status & Category */}
          <div className="col-span-6 md:col-span-2 flex flex-col gap-1">
            <Badge variant="outline" className="w-fit text-xs">
              <StatusIcon className="h-3 w-3 mr-1" />
              {getStatusLabel(ticket.status)}
            </Badge>
            <Badge variant="outline" className="w-fit text-xs capitalize">
              {ticket.category}
            </Badge>
          </div>
          
          {/* Submitted by */}
          <div className="col-span-6 md:col-span-2">
            <div className="text-xs text-muted-foreground">Submitted by:</div>
            <div className="text-xs font-medium truncate">{getUserDisplayName(ticket.profiles)}</div>
          </div>
          
          {/* Days open */}
          <div className="col-span-6 md:col-span-1">
            <div className="text-xs text-muted-foreground">Days open:</div>
            <div className={`text-xs ${getDaysOpenStyle()}`}>{daysOpen}</div>
          </div>
          
          {/* Assigned to */}
          <div className="col-span-6 md:col-span-2">
            <div className="text-xs text-muted-foreground">
              {ticket.assigned_to ? "Assigned:" : "Status:"}
            </div>
            <div className="text-xs font-medium truncate">
              {ticket.assigned_to && ticket.assigned_user 
                ? getUserDisplayName(ticket.assigned_user)
                : <span className={businessDaysOpen > 2 ? "bg-red-600 text-white px-1.5 py-0.5 rounded font-bold" : "text-muted-foreground"}>
                    Unassigned
                  </span>
              }
            </div>
          </div>
        </div>
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            {t("helpdesk.title") || "Helpdesk Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {t("helpdesk.subtitle") || "View and manage all support tickets"}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "created" | "status" | "daysOpen")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Created Date</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="daysOpen">Days Open</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={checkUnassignedTickets}
            disabled={checkingUnassigned}
            variant="outline"
            size="sm"
            title="Check for unassigned tickets and send notifications to helpdesk team members"
          >
            {checkingUnassigned ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              "Check Unassigned"
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {sortTickets(filterTickets(statusFilter)).length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {t("helpdesk.noTickets") || "No tickets found."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Header */}
              <div className="grid grid-cols-12 gap-3 p-3 bg-muted/50 font-semibold text-xs text-muted-foreground hidden md:grid">
                <div className="col-span-1 text-center">Priority</div>
                <div className="col-span-4">Ticket</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Submitted By</div>
                <div className="col-span-1">Days</div>
                <div className="col-span-2">Assigned To</div>
              </div>
              
              {/* Rows */}
              {sortTickets(filterTickets(statusFilter)).map((ticket, index) => (
                <TicketRow key={ticket.id} ticket={ticket} index={index} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpdeskDashboard;
