import { useState, useEffect, ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Send, Clock, AlertCircle, CheckCircle, XCircle, Activity } from "lucide-react";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  };
  creator?: {
    full_name: string | null;
    email: string;
  };
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  created_by: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
  is_admin: boolean;
}

interface HelpdeskUser {
  id: string;
  full_name: string | null;
  email: string;
}

interface TicketActivity {
  id: string;
  action_type: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  user_id: string | null;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

const statusConfig = {
  open: { label: "Open", icon: Clock, color: "text-blue-500" },
  in_progress: { label: "In Progress", icon: AlertCircle, color: "text-yellow-500" },
  resolved: { label: "Resolved", icon: CheckCircle, color: "text-green-500" },
  closed: { label: "Closed", icon: XCircle, color: "text-gray-500" },
};

const TicketDetail = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [helpdeskUsers, setHelpdeskUsers] = useState<HelpdeskUser[]>([]);
  const [updating, setUpdating] = useState(false);
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [allUsers, setAllUsers] = useState<HelpdeskUser[]>([]);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchMessages();
      fetchActivities();
      if (profile?.is_admin || profile?.is_helpdesk) {
        fetchHelpdeskUsers();
        fetchAllUsers();
      }
    }
  }, [id, profile]);

  const fetchTicket = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          assigned_user:profiles!tickets_assigned_to_fkey (
            full_name,
            email
          ),
          creator:profiles!tickets_created_by_fkey (
            full_name,
            email
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      
      if (data.created_by !== user?.id && !profile?.is_admin && !profile?.is_helpdesk) {
        navigate("/tickets");
        return;
      }
      
      setTicket(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load ticket",
        variant: "destructive",
      });
      navigate("/tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchHelpdeskUsers = async () => {
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "helpdesk"]);

      if (rolesError) throw rolesError;

      const userIds = rolesData?.map(r => r.user_id) || [];

      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        if (usersError) throw usersError;
        setHelpdeskUsers(usersData || []);
      }
    } catch (error: any) {
      console.error("Error fetching helpdesk users:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching all users:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("ticket_activities")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles for activities
      const activitiesWithProfiles = await Promise.all(
        (data || []).map(async (activity) => {
          if (activity.user_id) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", activity.user_id)
              .single();
            
            return { ...activity, profiles: profileData };
          }
          return { ...activity, profiles: null };
        })
      );

      setActivities(activitiesWithProfiles);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const getActivityDescription = (activity: TicketActivity): ReactNode => {
    const userName = activity.profiles?.full_name || activity.profiles?.email || "System";
    
    switch (activity.action_type) {
      case "created":
        return "Created the ticket";
      case "status_changed":
        return (
          <>
            Changed status from <span className="font-bold">{activity.old_value}</span> to{" "}
            <span className={`font-bold ${(activity.new_value === 'resolved' || activity.new_value === 'closed') ? 'text-green-600' : ''}`}>
              {activity.new_value}
            </span>
          </>
        );
      case "assigned":
        if (!activity.old_value && activity.new_value) {
          const assignedUser = helpdeskUsers.find(u => u.id === activity.new_value);
          return (
            <>
              Assigned to <span className="font-bold">{assignedUser?.full_name || assignedUser?.email || 'someone'}</span>
            </>
          );
        }
        return "Changed assignment";
      case "priority_changed":
        return (
          <>
            Changed priority from <span className="font-bold">{activity.old_value}</span> to <span className="font-bold">{activity.new_value}</span>
          </>
        );
      case "category_changed":
        return (
          <>
            Changed category from <span className="font-bold">{activity.old_value}</span> to <span className="font-bold">{activity.new_value}</span>
          </>
        );
      case "submitter_changed":
        const oldSubmitter = allUsers.find(u => u.id === activity.old_value);
        const newSubmitter = allUsers.find(u => u.id === activity.new_value);
        return (
          <>
            Changed submitter from <span className="font-bold">{oldSubmitter?.full_name || oldSubmitter?.email || 'unknown'}</span> to <span className="font-bold">{newSubmitter?.full_name || newSubmitter?.email || 'unknown'}</span>
          </>
        );
      case "replied_helpdesk":
        return "Replied (Helpdesk)";
      case "replied_user":
        return "Replied";
      default:
        return `Performed action: ${activity.action_type}`;
    }
  };

  const handleAssignTicket = async (userId: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ assigned_to: userId })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket assigned successfully",
      });

      fetchTicket();
      fetchActivities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeSubmitter = async (userId: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ created_by: userId })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submitter changed successfully",
      });

      fetchTicket();
      fetchActivities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: "open" | "in_progress" | "resolved" | "closed") => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Status updated successfully",
      });

      fetchTicket();
      fetchActivities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: "low" | "medium" | "high" | "urgent") => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ priority: newPriority })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Priority updated successfully",
      });

      fetchTicket();
      fetchActivities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCategoryChange = async (newCategory: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ category: newCategory })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category updated successfully",
      });

      fetchTicket();
      fetchActivities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch admin status for each message creator
      const messagesWithAdminStatus = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", msg.created_by)
            .single();
          
          return {
            ...msg,
            is_admin: roleData?.role === 'admin'
          };
        })
      );

      setMessages(messagesWithAdminStatus);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: id,
          created_by: user?.id,
          message: newMessage,
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages();
      
      // If helpdesk/admin replies and ticket is still open, set it to in_progress
      if ((profile?.is_admin || profile?.is_helpdesk) && ticket?.status === 'open') {
        await supabase
          .from("tickets")
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq("id", id);
      } else {
        await supabase
          .from("tickets")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", id);
      }
        
      fetchTicket();
      fetchActivities();

      toast({
        title: "Message sent",
        description: "Your message has been added to the ticket.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  const statusInfo = statusConfig[ticket.status as keyof typeof statusConfig];
  const StatusIcon = statusInfo?.icon || Clock;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 relative z-10 mb-4">
          <Button
            variant="outline"
            size="default"
            onClick={() => navigate("/tickets")}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    <StatusIcon className={`h-3 w-3 mr-1 ${statusInfo?.color}`} />
                    {statusInfo?.label}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {ticket.priority}
                  </Badge>
                  {ticket.category && (
                    <Badge variant="secondary" className="capitalize">
                      {ticket.category}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl mb-4">{ticket.title}</CardTitle>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Submitted by:</span>
                    {(profile?.is_admin || profile?.is_helpdesk) ? (
                      <Select
                        value={ticket.created_by}
                        onValueChange={handleChangeSubmitter}
                        disabled={updating}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{ticket.creator?.full_name || ticket.creator?.email || 'Unknown'}</p>
                    )}
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">{format(new Date(ticket.created_at), 'dd-MM-yyyy HH:mm')}</p>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Days open:</span>
                    <p className="font-medium">{differenceInDays(new Date(), new Date(ticket.created_at))} {differenceInDays(new Date(), new Date(ticket.created_at)) === 1 ? 'day' : 'days'}</p>
                  </div>
                  
                  {ticket.assigned_to && ticket.assigned_user ? (
                    <div>
                      <span className="text-muted-foreground">Assigned to:</span>
                      <p className="font-medium">{ticket.assigned_user.full_name || ticket.assigned_user.email}</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-muted-foreground">Assigned to:</span>
                      <p className="font-medium text-muted-foreground">Not yet assigned</p>
                    </div>
                  )}
                  
                  {ticket.resolved_at && (
                    <div>
                      <span className="text-muted-foreground">Resolved on:</span>
                      <p className="font-medium text-green-600">{format(new Date(ticket.resolved_at), 'dd-MM-yyyy HH:mm')}</p>
                    </div>
                  )}
                  
                  {ticket.closed_at && (
                    <div>
                      <span className="text-muted-foreground">Closed on:</span>
                      <p className="font-medium text-gray-600">{format(new Date(ticket.closed_at), 'dd-MM-yyyy HH:mm')}</p>
                    </div>
                  )}
                </div>
                
                {(profile?.is_admin || profile?.is_helpdesk) && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium min-w-[80px]">Assign to:</span>
                        <Select
                          value={ticket.assigned_to || ""}
                          onValueChange={handleAssignTicket}
                          disabled={updating}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                          <SelectContent>
                            {helpdeskUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name || user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium min-w-[80px]">Priority:</span>
                        <Select
                          value={ticket.priority}
                          onValueChange={handlePriorityChange}
                          disabled={updating}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium min-w-[80px]">Category:</span>
                        <Select
                          value={ticket.category}
                          onValueChange={handleCategoryChange}
                          disabled={updating}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hardware">Hardware</SelectItem>
                            <SelectItem value="software">Software</SelectItem>
                            <SelectItem value="network">Network</SelectItem>
                            <SelectItem value="access">Access</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium min-w-[80px]">Status:</span>
                        <div className="flex gap-1 flex-1">
                          <Button
                            size="sm"
                            variant={ticket.status === "in_progress" ? "default" : "outline"}
                            onClick={() => handleStatusChange("in_progress")}
                            disabled={updating || ticket.status === "in_progress"}
                            className="flex-1 text-xs px-2"
                          >
                            In Progress
                          </Button>
                          <Button
                            size="sm"
                            variant={ticket.status === "resolved" ? "default" : "outline"}
                            onClick={() => handleStatusChange("resolved")}
                            disabled={updating || ticket.status === "resolved"}
                            className="flex-1 text-xs px-2"
                          >
                            Resolved
                          </Button>
                          <Button
                            size="sm"
                            variant={ticket.status === "closed" ? "default" : "outline"}
                            onClick={() => handleStatusChange("closed")}
                            disabled={updating || ticket.status === "closed"}
                            className="flex-1 text-xs px-2"
                          >
                            Closed
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Description:</p>
              <p className="whitespace-pre-line">{ticket.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation below.
              </p>
            ) : (
              messages.map((message) => {
                const isAdmin = message.is_admin;
                const displayName = message.profiles?.full_name || message.profiles?.email || "User";
                const initials = displayName.charAt(0).toUpperCase();

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.created_by === user?.id ? "justify-end" : ""}`}
                  >
                    {message.created_by !== user?.id && (
                      <Avatar className={isAdmin ? "border-2 border-primary" : ""}>
                        <AvatarFallback className={isAdmin ? "bg-primary text-primary-foreground" : ""}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`flex-1 ${message.created_by === user?.id ? "text-right" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {message.created_by !== user?.id && (
                          <>
                            <span className="text-sm font-medium">{displayName}</span>
                            {isAdmin && (
                              <Badge variant="secondary" className="text-xs">
                                IT Support
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      <div className="rounded-lg p-3 bg-muted">
                        <p className="whitespace-pre-line">{message.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 inline-block">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {message.created_by === user?.id && (
                      <Avatar>
                        <AvatarFallback>{profile?.full_name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })
            )}

            <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No activities recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Who</TableHead>
                    <TableHead>What</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity, index) => (
                    <TableRow key={activity.id} className={index % 2 === 1 ? "bg-[#F5F3EF]" : ""}>
                      <TableCell>
                        {activity.profiles?.full_name || activity.profiles?.email || "System"}
                      </TableCell>
                      <TableCell>{getActivityDescription(activity)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(activity.created_at), 'dd-MM-yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
  );
};

export default TicketDetail;
