import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Ticket, HelpCircle, Clock, AlertCircle, CheckCircle, Mail, UserX, UserCheck, Edit2, ArrowRightLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TicketWithUser {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
}

interface Stats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
}

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  user_roles: Array<{ role: string; id: string }>;
}

const AdminPanel = () => {
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState("");
  const [nameUpdateLoading, setNameUpdateLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editEmailDialogOpen, setEditEmailDialogOpen] = useState(false);
  const [editingUserEmail, setEditingUserEmail] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [emailUpdateLoading, setEmailUpdateLoading] = useState(false);
  const [fromHelpdesk, setFromHelpdesk] = useState("");
  const [toHelpdesk, setToHelpdesk] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
    fetchStats();
    fetchUsers();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          creator:profiles!created_by (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const ticketsWithProfiles = (data || []).map(ticket => ({
        ...ticket,
        profiles: ticket.creator
      }));
      
      setTickets(ticketsWithProfiles);
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

  const fetchStats = async () => {
    try {
      const { count: totalTickets } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true });

      const { count: openTickets } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      const { count: inProgressTickets } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_progress");

      const { count: resolvedTickets } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "resolved");

      setStats({
        totalTickets: totalTickets || 0,
        openTickets: openTickets || 0,
        inProgressTickets: inProgressTickets || 0,
        resolvedTickets: resolvedTickets || 0,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles (
            id,
            role
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string, isChecked: boolean) => {
    try {
      if (isChecked) {
        // Add role
        const { error } = await supabase
          .from("user_roles")
          .insert({ 
            user_id: userId, 
            role: role as any
          });

        if (error) throw error;

        toast({
          title: "Role added",
          description: `${role} role has been assigned successfully.`,
        });
      } else {
        // Remove role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role as any);

        if (error) throw error;

        toast({
          title: "Role removed",
          description: `${role} role has been removed successfully.`,
        });
      }

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ 
          status: newStatus as "open" | "in_progress" | "resolved" | "closed"
        })
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: "Ticket status has been updated successfully.",
      });

      fetchTickets();
      fetchStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEmailUpdate = async () => {
    if (!editingUserEmail || !newUserEmail) {
      toast({
        title: "Error",
        description: "Vul beide email velden in",
        variant: "destructive",
      });
      return;
    }

    setEmailUpdateLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('update-user-email', {
        body: { oldEmail: editingUserEmail, newEmail: newUserEmail }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message || "Email adres succesvol gewijzigd",
      });

      setEditingUserEmail("");
      setNewUserEmail("");
      setEditEmailDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Kon email adres niet wijzigen",
        variant: "destructive",
      });
    } finally {
      setEmailUpdateLoading(false);
    }
  };

  const handleToggleUserActive = async (userId: string, isBanned: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { 
          userId, 
          action: isBanned ? 'unban' : 'ban'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleUpdateName = async () => {
    if (!editingUserId || !editingUserName) return;

    setNameUpdateLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { 
          userId: editingUserId, 
          action: 'update_name',
          fullName: editingUserName
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message,
      });

      setEditingUserId(null);
      setEditingUserName("");
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update name",
        variant: "destructive",
      });
    } finally {
      setNameUpdateLoading(false);
    }
  };

  const handleTransferTickets = async () => {
    if (!fromHelpdesk || !toHelpdesk) {
      toast({
        title: "Error",
        description: "Selecteer beide helpdesk medewerkers",
        variant: "destructive",
      });
      return;
    }

    setTransferLoading(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ assigned_to: toHelpdesk })
        .eq("assigned_to", fromHelpdesk)
        .in("status", ["open", "in_progress"]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tickets succesvol overgedragen",
      });

      setFromHelpdesk("");
      setToHelpdesk("");
      fetchTickets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to transfer tickets",
        variant: "destructive",
      });
    } finally {
      setTransferLoading(false);
    }
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
        <h1 className="text-3xl font-bold text-primary mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage tickets, users, and support requests</p>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="transfer">Transfer Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTickets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openTickets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgressTickets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolvedTickets}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tickets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No tickets found.</p>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <Link to={`/tickets/${ticket.id}`} className="hover:underline">
                        <h4 className="font-semibold truncate">{ticket.title}</h4>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{ticket.profiles?.full_name || ticket.profiles?.email}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Badge variant="outline" className="capitalize">
                        {ticket.priority}
                      </Badge>
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => handleStatusChange(ticket.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Link to={`/tickets/${ticket.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No users found.</p>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold truncate">
                              {user.full_name || user.email}
                            </h4>
                            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingUserId(user.id);
                                    setEditingUserName(user.full_name || "");
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Wijzig naam</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="editName">Volledige naam</Label>
                                    <Input
                                      id="editName"
                                      value={editingUserName}
                                      onChange={(e) => setEditingUserName(e.target.value)}
                                    />
                                  </div>
                                  <Button 
                                    onClick={handleUpdateName} 
                                    disabled={nameUpdateLoading}
                                  >
                                    {nameUpdateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Opslaan
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <Dialog open={editEmailDialogOpen} onOpenChange={setEditEmailDialogOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingUserEmail(user.email);
                                    setNewUserEmail("");
                                    setEditEmailDialogOpen(true);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Wijzig email adres</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Huidig email adres</Label>
                                    <Input value={editingUserEmail} disabled />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="newEmail">Nieuw email adres</Label>
                                    <Input
                                      id="newEmail"
                                      type="email"
                                      value={newUserEmail}
                                      onChange={(e) => setNewUserEmail(e.target.value)}
                                      placeholder="nieuw@email.com"
                                    />
                                  </div>
                                  <Button 
                                    onClick={handleEmailUpdate} 
                                    disabled={emailUpdateLoading}
                                  >
                                    {emailUpdateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Opslaan
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`${user.id}-admin`}
                                checked={user.user_roles.some(r => r.role === 'admin')}
                                onCheckedChange={(checked) => 
                                  handleRoleChange(user.id, 'admin', checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`${user.id}-admin`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                Admin
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`${user.id}-helpdesk`}
                                checked={user.user_roles.some(r => r.role === 'helpdesk')}
                                onCheckedChange={(checked) => 
                                  handleRoleChange(user.id, 'helpdesk', checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`${user.id}-helpdesk`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                Helpdesk
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`${user.id}-user`}
                                checked={user.user_roles.some(r => r.role === 'user')}
                                onCheckedChange={(checked) => 
                                  handleRoleChange(user.id, 'user', checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`${user.id}-user`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                User
                              </label>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleUserActive(user.id, false)}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Deactiveer
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Transfer Open/In Progress Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="fromHelpdesk">Van helpdesk medewerker</Label>
                  <Select value={fromHelpdesk} onValueChange={setFromHelpdesk}>
                    <SelectTrigger id="fromHelpdesk">
                      <SelectValue placeholder="Selecteer medewerker" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(u => u.user_roles.some(r => r.role === 'helpdesk'))
                        .map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.full_name || u.email}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toHelpdesk">Naar helpdesk medewerker</Label>
                  <Select value={toHelpdesk} onValueChange={setToHelpdesk}>
                    <SelectTrigger id="toHelpdesk">
                      <SelectValue placeholder="Selecteer medewerker" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(u => u.user_roles.some(r => r.role === 'helpdesk') && u.id !== fromHelpdesk)
                        .map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.full_name || u.email}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleTransferTickets} disabled={transferLoading}>
                  {transferLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Transfer Tickets
                </Button>
                <p className="text-sm text-muted-foreground">
                  Alle open en in progress tickets van de eerste medewerker worden overgedragen aan de tweede medewerker.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
