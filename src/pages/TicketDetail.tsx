import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Send, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

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
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchMessages();
    }
  }, [id]);

  const fetchTicket = async () => {
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
      
      await supabase
        .from("tickets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", id);
        
      fetchTicket();

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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/tickets")}
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
                    <span className="text-muted-foreground">Aangemaakt:</span>
                    <p className="font-medium">{format(new Date(ticket.created_at), 'dd-MM-yyyy HH:mm')}</p>
                  </div>
                  
                  {ticket.assigned_to && ticket.assigned_user && (
                    <div>
                      <span className="text-muted-foreground">Behandelaar:</span>
                      <p className="font-medium">{ticket.assigned_user.full_name || ticket.assigned_user.email}</p>
                    </div>
                  )}
                  
                  {!ticket.assigned_to && (
                    <div>
                      <span className="text-muted-foreground">Behandelaar:</span>
                      <p className="font-medium text-muted-foreground">Nog niet toegewezen</p>
                    </div>
                  )}
                  
                  {ticket.resolved_at && (
                    <div>
                      <span className="text-muted-foreground">Opgelost op:</span>
                      <p className="font-medium text-green-600">{format(new Date(ticket.resolved_at), 'dd-MM-yyyy HH:mm')}</p>
                    </div>
                  )}
                  
                  {ticket.closed_at && (
                    <div>
                      <span className="text-muted-foreground">Gesloten op:</span>
                      <p className="font-medium text-gray-600">{format(new Date(ticket.closed_at), 'dd-MM-yyyy HH:mm')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Beschrijving:</p>
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
                    <div className={`flex-1 max-w-[70%] ${message.created_by === user?.id ? "text-right" : ""}`}>
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
                      <div
                        className={`rounded-lg p-3 ${
                          message.created_by === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
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
      </div>
  );
};

export default TicketDetail;
