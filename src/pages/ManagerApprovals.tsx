import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PendingTicket {
  id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  sub_category: string;
  created_at: string;
  phone_number: string;
  creator: {
    full_name: string | null;
    email: string;
    company: string | null;
  };
}

const ManagerApprovals = () => {
  const [tickets, setTickets] = useState<PendingTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingApprovals();
  }, [user]);

  const fetchPendingApprovals = async () => {
    if (!user?.id) return;

    try {
      // First, get the user's team
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("team_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.team_id) {
        console.log("Manager has no team assigned");
        setTickets([]);
        setLoading(false);
        return;
      }

      // Get all pending tickets from users in the same team
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          title,
          description,
          priority,
          category,
          sub_category,
          created_at,
          phone_number,
          creator:profiles!created_by (
            full_name,
            email,
            company,
            team_id
          )
        `)
        .eq("approval_status", "pending")
        .eq("creator.team_id", profile.team_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTickets(data || []);
    } catch (error: any) {
      console.error("Error fetching pending approvals:", error);
      toast({
        title: "Error",
        description: "Failed to load pending approvals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (ticketId: string) => {
    setActionLoading(ticketId);
    try {
      // Update ticket: approve and change status to open for helpdesk
      const { error } = await supabase
        .from("tickets")
        .update({
          approval_status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          status: "open", // Move to helpdesk queue
        })
        .eq("id", ticketId);

      if (error) throw error;

      // Send notification to helpdesk about approved ticket
      try {
        const ticket = tickets.find(t => t.id === ticketId);
        await supabase.functions.invoke('notify-new-ticket', {
          body: {
            ticketId,
            title: ticket?.title,
            description: ticket?.description,
            priority: ticket?.priority,
            category: ticket?.sub_category,
            userName: ticket?.creator?.full_name || ticket?.creator?.email,
            userEmail: ticket?.creator?.email,
            phoneNumber: ticket?.phone_number,
          }
        });
      } catch (emailError) {
        console.error("Error sending helpdesk notification:", emailError);
      }

      toast({
        title: "Request approved",
        description: "The request has been approved and sent to the helpdesk.",
      });

      fetchPendingApprovals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (ticketId: string) => {
    setSelectedTicket(ticketId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedTicket || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(selectedTicket);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          approval_status: "rejected",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
          status: "closed", // Close rejected tickets
        })
        .eq("id", selectedTicket);

      if (error) throw error;

      toast({
        title: "Request rejected",
        description: "The submitter has been notified of the rejection.",
      });

      setRejectDialogOpen(false);
      fetchPendingApprovals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
      setSelectedTicket(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Manager Approvals</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve requests from your team
        </p>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No pending approvals</p>
            <p className="text-sm text-muted-foreground">
              All requests from your team have been processed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{ticket.title}</CardTitle>
                      <Badge variant={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.creator?.full_name || ticket.creator?.email}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Category</p>
                  <Badge variant="outline">{ticket.sub_category}</Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{ticket.description}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Contact</p>
                  <p className="text-sm">{ticket.phone_number}</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleApprove(ticket.id)}
                    disabled={actionLoading === ticket.id}
                    className="flex-1"
                  >
                    {actionLoading === ticket.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleRejectClick(ticket.id)}
                    disabled={actionLoading === ticket.id}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request. The submitter will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim()}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerApprovals;