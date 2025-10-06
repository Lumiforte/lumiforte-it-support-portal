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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Ticket, HelpCircle, Clock, AlertCircle, CheckCircle, Mail, UserX, UserCheck, Edit2, ArrowRightLeft, UserPlus, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { COMPANIES } from "@/lib/companies";

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
  company: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  invitation_sent_at: string | null;
  banned_until: string | null;
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
  const [editingUserNameId, setEditingUserNameId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState("");
  const [editNameLoading, setEditNameLoading] = useState(false);
  const [editingUserEmailId, setEditingUserEmailId] = useState<string | null>(null);
  const [editingUserEmail, setEditingUserEmail] = useState("");
  const [editEmailLoading, setEditEmailLoading] = useState(false);
  const [editingUserCompanyId, setEditingUserCompanyId] = useState<string | null>(null);
  const [editingUserCompany, setEditingUserCompany] = useState("");
  const [editCompanyLoading, setEditCompanyLoading] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ email: "", fullName: "", company: "" });
  const [newUserRoles, setNewUserRoles] = useState<string[]>([]);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [sendingInvitationUserId, setSendingInvitationUserId] = useState<string | null>(null);
  const [fromHelpdesk, setFromHelpdesk] = useState("");
  const [toHelpdesk, setToHelpdesk] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortByRole, setSortByRole] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
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
      const { data, error } = await supabase.functions.invoke("get-users-with-auth-data");

      if (error) throw error;
      setUsers(data?.users || []);
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

  const handleUpdateUserName = async (userId: string) => {
    setEditNameLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: editingUserName.trim() || null })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User name updated successfully",
      });

      fetchUsers();
      setEditingUserNameId(null);
      setEditingUserName("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEditNameLoading(false);
    }
  };

  const handleUpdateUserEmail = async (userId: string) => {
    setEditEmailLoading(true);
    try {
      const { error } = await supabase.functions.invoke("update-user-email", {
        body: { 
          userId,
          newEmail: editingUserEmail 
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User email updated successfully",
      });

      fetchUsers();
      setEditingUserEmailId(null);
      setEditingUserEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEditEmailLoading(false);
    }
  };

  const handleUpdateUserCompany = async (userId: string) => {
    setEditCompanyLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ company: editingUserCompany || null })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User company updated successfully",
      });

      fetchUsers();
      setEditingUserCompanyId(null);
      setEditingUserCompany("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEditCompanyLoading(false);
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

  const handleTransferTickets = async () => {
    if (!fromHelpdesk || !toHelpdesk) {
      toast({
        title: "Error",
        description: "Please select both helpdesk agents",
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
        description: "Tickets transferred successfully",
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

  const handleCreateUser = async () => {
    // Validate all required fields
    if (!newUserData.email || !newUserData.email.trim()) {
      toast({
        title: "Validatiefout",
        description: "E-mailadres is verplicht",
        variant: "destructive",
      });
      return;
    }

    if (!newUserData.fullName || !newUserData.fullName.trim()) {
      toast({
        title: "Validatiefout",
        description: "Naam is verplicht",
        variant: "destructive",
      });
      return;
    }

    if (!newUserData.company || newUserData.company === "none" || !newUserData.company.trim()) {
      toast({
        title: "Validatiefout",
        description: "Bedrijfsnaam is verplicht",
        variant: "destructive",
      });
      return;
    }

    if (newUserRoles.length === 0) {
      toast({
        title: "Validatiefout",
        description: "Selecteer minimaal één rol",
        variant: "destructive",
      });
      return;
    }

    setCreateUserLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserData.email.trim(),
          fullName: newUserData.fullName.trim(),
          company: newUserData.company.trim(),
          roles: newUserRoles
        }
      });

      if (error) throw error;

      toast({
        title: "Succes",
        description: data.message || "Gebruiker succesvol aangemaakt. Stuur nu een uitnodiging om de gebruiker in te laten loggen.",
      });

      setNewUserData({ email: "", fullName: "", company: "" });
      setNewUserRoles([]);
      setAddUserDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleSendInvitation = async (userId: string) => {
    setSendingInvitationUserId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Niet ingelogd",
          variant: "destructive",
        });
        return;
      }

      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', session.user.id)
        .single();

      const { data, error } = await supabase.functions.invoke('send-user-invitation', {
        body: {
          userId,
          adminEmail: adminProfile?.email || session.user.email
        }
      });

      if (error) throw error;

      toast({
        title: "Uitnodiging verstuurd",
        description: "De gebruiker heeft een e-mail ontvangen om een wachtwoord in te stellen.",
      });
      
      // Refresh users list to show invitation timestamp
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Kon uitnodiging niet versturen",
        variant: "destructive",
      });
    } finally {
      setSendingInvitationUserId(null);
    }
  };

  const toggleNewUserRole = (role: string) => {
    setNewUserRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const getFilteredAndSortedUsers = () => {
    let filteredUsers = users;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filteredUsers = filteredUsers.filter(user => 
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Filter by role
    if (roleFilter !== "all") {
      filteredUsers = filteredUsers.filter(user => 
        user.user_roles.some(r => r.role === roleFilter)
      );
    }

    // Filter by company
    if (companyFilter !== "all") {
      filteredUsers = filteredUsers.filter(user => user.company === companyFilter);
    }

    // Sort by role
    if (sortByRole) {
      filteredUsers = [...filteredUsers].sort((a, b) => {
        const aHasAdmin = a.user_roles.some(r => r.role === 'admin');
        const bHasAdmin = b.user_roles.some(r => r.role === 'admin');
        const aHasHelpdesk = a.user_roles.some(r => r.role === 'helpdesk');
        const bHasHelpdesk = b.user_roles.some(r => r.role === 'helpdesk');
        
        if (aHasAdmin && !bHasAdmin) return -1;
        if (!aHasAdmin && bHasAdmin) return 1;
        if (aHasHelpdesk && !bHasHelpdesk) return -1;
        if (!aHasHelpdesk && bHasHelpdesk) return 1;
        return 0;
      });
    }

    return filteredUsers;
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

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
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
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        New User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="newEmail">Email Address *</Label>
                          <Input
                            id="newEmail"
                            type="email"
                            value={newUserData.email}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="gebruiker@email.com"
                          />
                          <p className="text-xs text-muted-foreground">
                            Na het aanmaken kun je de gebruiker uitnodigen om een wachtwoord in te stellen
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newFullName">Volledige naam</Label>
                          <Input
                            id="newFullName"
                            value={newUserData.fullName}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, fullName: e.target.value }))}
                            placeholder="Jan Jansen"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newCompany">Bedrijf</Label>
                          <Select
                            value={newUserData.company}
                            onValueChange={(value) => setNewUserData(prev => ({ ...prev, company: value }))}
                          >
                            <SelectTrigger id="newCompany">
                              <SelectValue placeholder="Selecteer bedrijf" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Geen bedrijf</SelectItem>
                              {COMPANIES.map(company => (
                                <SelectItem key={company.value} value={company.value}>
                                  {company.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Roles</Label>
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="role-user"
                                checked={newUserRoles.includes('user')}
                                onCheckedChange={() => toggleNewUserRole('user')}
                              />
                              <label htmlFor="role-user" className="text-sm cursor-pointer">User</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="role-helpdesk"
                                checked={newUserRoles.includes('helpdesk')}
                                onCheckedChange={() => toggleNewUserRole('helpdesk')}
                              />
                              <label htmlFor="role-helpdesk" className="text-sm cursor-pointer">Helpdesk</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="role-hr"
                                checked={newUserRoles.includes('hr')}
                                onCheckedChange={() => toggleNewUserRole('hr')}
                              />
                              <label htmlFor="role-hr" className="text-sm cursor-pointer">HR</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="role-admin"
                                checked={newUserRoles.includes('admin')}
                                onCheckedChange={() => toggleNewUserRole('admin')}
                              />
                              <label htmlFor="role-admin" className="text-sm cursor-pointer">Admin</label>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">If no role selected, &apos;User&apos; will be assigned automatically</p>
                        </div>
                        <Button onClick={handleCreateUser} disabled={createUserLoading} className="w-full">
                          {createUserLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Create User
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Zoek op naam of e-mail..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="admin">Admins Only</SelectItem>
                      <SelectItem value="helpdesk">Helpdesk Only</SelectItem>
                      <SelectItem value="user">Users Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {COMPANIES.map(company => (
                        <SelectItem key={company.value} value={company.value}>{company.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant={sortByRole ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortByRole(!sortByRole)}
                  >
                    Sort by Role
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-1">
                  {getFilteredAndSortedUsers().length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No users found.</p>
                  ) : (
                    getFilteredAndSortedUsers().map((user, index) => (
                       <div
                         key={user.id}
                         className={`flex items-center justify-between p-3 ${
                           user.banned_until 
                             ? 'bg-destructive/10 border-l-4 border-destructive' 
                             : index % 2 === 0 
                               ? 'bg-accent/40' 
                               : 'bg-background'
                         }`}
                       >
                         <div className="flex-1 min-w-0 space-y-2">
                           <div className="flex items-center gap-2 flex-wrap">
                             <h4 className={`font-semibold truncate ${user.banned_until ? 'text-muted-foreground' : ''}`}>
                               {user.full_name || user.email}
                             </h4>
                             {user.banned_until && (
                               <Badge variant="destructive" className="text-xs">
                                 Gedeactiveerd
                               </Badge>
                             )}
                             {user.company && (
                               <Badge variant="outline" className="text-xs">
                                 {user.company}
                               </Badge>
                             )}
                            <span className="text-xs text-muted-foreground">
                              Aangemaakt: {new Date(user.created_at).toLocaleString('nl-NL', {
                                day: '2-digit',
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {!user.last_sign_in_at && user.invitation_sent_at && (
                              <span className="text-xs text-muted-foreground">
                                Uitnodiging verstuurd: {new Date(user.invitation_sent_at).toLocaleString('nl-NL', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric', 
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                            {user.last_sign_in_at && (
                              <span className="text-xs text-muted-foreground">
                                Laatste login: {new Date(user.last_sign_in_at).toLocaleString('nl-NL', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric', 
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                            {editingUserNameId === user.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingUserName}
                                  onChange={(e) => setEditingUserName(e.target.value)}
                                  className="h-8 max-w-[200px]"
                                  placeholder="Full name"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateUserName(user.id)}
                                  disabled={editNameLoading}
                                >
                                  {editNameLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingUserNameId(null);
                                    setEditingUserName("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingUserNameId(user.id);
                                  setEditingUserName(user.full_name || "");
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {editingUserEmailId === user.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="email"
                                  value={editingUserEmail}
                                  onChange={(e) => setEditingUserEmail(e.target.value)}
                                  className="h-8 max-w-[200px]"
                                  placeholder="Email"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateUserEmail(user.id)}
                                  disabled={editEmailLoading}
                                >
                                  {editEmailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingUserEmailId(null);
                                    setEditingUserEmail("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingUserEmailId(user.id);
                                  setEditingUserEmail(user.email);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {editingUserCompanyId === user.id ? (
                              <div className="flex items-center gap-2">
                                <Select value={editingUserCompany} onValueChange={setEditingUserCompany}>
                                  <SelectTrigger className="h-8 max-w-[200px]">
                                    <SelectValue placeholder="Select company..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {COMPANIES.map((companyOption) => (
                                      <SelectItem key={companyOption.value} value={companyOption.value}>
                                        {companyOption.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateUserCompany(user.id)}
                                  disabled={editCompanyLoading}
                                >
                                  {editCompanyLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingUserCompanyId(null);
                                    setEditingUserCompany("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">
                                  Company: {user.company || "Not set"}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingUserCompanyId(user.id);
                                    setEditingUserCompany(user.company || "");
                                  }}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <div className="flex items-center gap-4">
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
                            onClick={() => handleSendInvitation(user.id)}
                            disabled={sendingInvitationUserId === user.id}
                          >
                            {sendingInvitationUserId === user.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4 mr-2" />
                            )}
                            Uitnodiging
                          </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleToggleUserActive(user.id, !!user.banned_until)}
                           >
                             {user.banned_until ? (
                               <>
                                 <UserCheck className="h-4 w-4 mr-2" />
                                 Activeren
                               </>
                             ) : (
                               <>
                                 <UserX className="h-4 w-4 mr-2" />
                                 Deactiveren
                               </>
                             )}
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
                  <Label htmlFor="fromHelpdesk">From helpdesk agent</Label>
                  <Select value={fromHelpdesk} onValueChange={setFromHelpdesk}>
                    <SelectTrigger id="fromHelpdesk">
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name || u.email}
                          {u.user_roles.some(r => r.role === 'helpdesk') ? 
                            " (Helpdesk)" : 
                            u.user_roles.some(r => r.role === 'admin') ? " (Admin)" : ""
                          }
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toHelpdesk">To helpdesk agent</Label>
                  <Select value={toHelpdesk} onValueChange={setToHelpdesk}>
                    <SelectTrigger id="toHelpdesk">
                      <SelectValue placeholder="Select agent" />
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
                  All open and in progress tickets from the first agent will be transferred to the second agent.
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
