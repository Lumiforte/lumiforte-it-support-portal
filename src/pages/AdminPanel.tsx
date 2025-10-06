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
import { Loader2, Users, Ticket, HelpCircle, Clock, AlertCircle, CheckCircle, Mail, UserX, UserCheck, Edit2, ArrowRightLeft, UserPlus, Search, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { COMPANIES } from "@/lib/companies";
import { AuditLogs } from "@/components/AuditLogs";
import UserAnalytics from "@/pages/UserAnalytics";

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
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const PROTECTED_ADMINS = ['jeroen.vrieselaar@lumiforte.com', 'jort.gerritsen@lumiforte.com'];
  const isProtectedAdmin = (email: string) => PROTECTED_ADMINS.includes(email);
 
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
    // Check if this is a protected admin account
    const user = users.find(u => u.id === userId);
    
    if (user && isProtectedAdmin(user.email)) {
      toast({
        title: "Protected Account",
        description: "This admin account cannot be modified.",
        variant: "destructive",
      });
      return;
    }

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

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    setDeletingUserId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      // Check if the edge function returned an error status
      if (error) {
        console.error("Delete user error:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete user",
          variant: "destructive",
        });
        return;
      }

      // Check if the response contains an error message (400 status from edge function)
      if (data?.error) {
        toast({
          title: "Cannot Delete User",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // Success case
      if (data?.success) {
        toast({
          title: "Success",
          description: data.message || "User deleted successfully",
        });
        fetchUsers();
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleCreateUser = async () => {
    // Validate all required fields
    if (!newUserData.email || !newUserData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email address is required",
        variant: "destructive",
      });
      return;
    }

    if (!newUserData.fullName || !newUserData.fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!newUserData.company || newUserData.company === "none" || !newUserData.company.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }

    // Roles are optional - everyone is a user by default

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
        title: "Success",
        description: data.message || "User created successfully. Now send an invitation to let the user log in.",
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
          description: "Not logged in",
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
        title: "Invitation Sent",
        description: "The user has received an email to set a password.",
      });
      
      // Refresh users list to show invitation timestamp
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
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

    // Sort: active users first, then deactivated users at the bottom
    filteredUsers = [...filteredUsers].sort((a, b) => {
      const aIsDeactivated = !!a.banned_until;
      const bIsDeactivated = !!b.banned_until;
      
      // If one is deactivated and one is not, put deactivated at bottom
      if (aIsDeactivated && !bIsDeactivated) return 1;
      if (!aIsDeactivated && bIsDeactivated) return -1;
      
      // If both have same deactivation status, sort by role if enabled
      if (sortByRole) {
        const aHasAdmin = a.user_roles.some(r => r.role === 'admin');
        const bHasAdmin = b.user_roles.some(r => r.role === 'admin');
        const aHasHelpdesk = a.user_roles.some(r => r.role === 'helpdesk');
        const bHasHelpdesk = b.user_roles.some(r => r.role === 'helpdesk');
        
        if (aHasAdmin && !bHasAdmin) return -1;
        if (!aHasAdmin && bHasAdmin) return 1;
        if (aHasHelpdesk && !bHasHelpdesk) return -1;
        if (!aHasHelpdesk && bHasHelpdesk) return 1;
      }
      
      return 0;
    });

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
          <TabsTrigger value="analytics">User Analytics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
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
                            placeholder="user@email.com"
                          />
                          <p className="text-xs text-muted-foreground">
                            After creating, you can invite the user to set a password
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newFullName">Full Name *</Label>
                          <Input
                            id="newFullName"
                            value={newUserData.fullName}
                            onChange={(e) => setNewUserData(prev => ({ ...prev, fullName: e.target.value }))}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newCompany">Company *</Label>
                          <Select
                            value={newUserData.company}
                            onValueChange={(value) => setNewUserData(prev => ({ ...prev, company: value }))}
                          >
                            <SelectTrigger id="newCompany">
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No company</SelectItem>
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
                                id="role-helpdesk"
                                checked={newUserRoles.includes('helpdesk')}
                                onCheckedChange={() => toggleNewUserRole('helpdesk')}
                              />
                              <label htmlFor="role-helpdesk" className="text-sm cursor-pointer">Helpdesk</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="role-manager"
                                checked={newUserRoles.includes('manager')}
                                onCheckedChange={() => toggleNewUserRole('manager')}
                              />
                              <label htmlFor="role-manager" className="text-sm cursor-pointer">Manager</label>
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
                          <p className="text-xs text-muted-foreground">Select additional roles for this user (everyone is a user by default)</p>
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
                      placeholder="Search by name or email..."
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
                      <SelectItem value="hr">HR Only</SelectItem>
                      <SelectItem value="manager">Managers Only</SelectItem>
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
                           {/* First line: Name, Company, Email */}
                           <div className="flex items-center gap-3 flex-wrap">
                             {/* Name */}
                             <div className="flex items-center gap-2">
                               {editingUserNameId === user.id ? (
                                 <>
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
                                 </>
                                ) : (
                                  <>
                                    <h4 className={`font-semibold ${user.banned_until ? 'text-muted-foreground' : ''}`}>
                                      {user.full_name || user.email}
                                    </h4>
                                    {!isProtectedAdmin(user.email) && (
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
                                  </>
                                )}
                             </div>

                             {/* Company */}
                             <div className="flex items-center gap-2">
                               {editingUserCompanyId === user.id ? (
                                 <>
                                   <Select value={editingUserCompany} onValueChange={setEditingUserCompany}>
                                     <SelectTrigger className="h-8 max-w-[200px]">
                                       <SelectValue placeholder="Selecteer bedrijf..." />
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
                                 </>
                               ) : (
                                 <>
                                   {user.company && (
                                     <Badge variant="outline" className="text-xs">
                                       {user.company}
                                     </Badge>
                                   )}
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
                                 </>
                               )}
                             </div>

                             {/* Email */}
                             <div className="flex items-center gap-2">
                               {editingUserEmailId === user.id ? (
                                 <>
                                   <Input
                                     type="email"
                                     value={editingUserEmail}
                                     onChange={(e) => setEditingUserEmail(e.target.value)}
                                     className="h-8 max-w-[250px]"
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
                                 </>
                                ) : (
                                  <>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                    {!isProtectedAdmin(user.email) && (
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
                                  </>
                                )}
                             </div>

                              {/* Status badges */}
                              {user.banned_until && (
                                <Badge variant="destructive" className="text-xs">
                                  Deactivated
                                </Badge>
                              )}
                            </div>

                            {/* Second line: Dates */}
                            <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                              <span>
                                Created: {new Date(user.created_at).toLocaleString('en-US', {
                                  day: '2-digit',
                                  month: '2-digit', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {user.invitation_sent_at && (
                                <span>
                                  Invitation sent: {new Date(user.invitation_sent_at).toLocaleString('en-US', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric', 
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                              {user.last_sign_in_at && (
                                <span>
                                  Last login: {new Date(user.last_sign_in_at).toLocaleString('en-US', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric', 
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                              {user.banned_until && (
                                <span className="text-destructive font-medium">
                                  Deactivated: {new Date(user.banned_until).toLocaleString('en-US', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric', 
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
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
                                id={`${user.id}-manager`}
                                checked={user.user_roles.some(r => r.role === 'manager')}
                                onCheckedChange={(checked) => 
                                  handleRoleChange(user.id, 'manager', checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`${user.id}-manager`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                Manager
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`${user.id}-hr`}
                                checked={user.user_roles.some(r => r.role === 'hr')}
                                onCheckedChange={(checked) => 
                                  handleRoleChange(user.id, 'hr', checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`${user.id}-hr`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                HR
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
                            Send Invitation
                          </Button>
                           {(user.email === 'jeroen.vrieselaar@lumiforte.com' || user.email === 'jort.gerritsen@lumiforte.com') ? (
                             <Badge variant="secondary" className="px-3 py-1">
                               <span className="text-xs">🛡️ Protected Admin</span>
                             </Badge>
                           ) : (
                             <>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleToggleUserActive(user.id, !!user.banned_until)}
                               >
                                 {user.banned_until ? (
                                   <>
                                     <UserCheck className="h-4 w-4 mr-2" />
                                     Activate
                                   </>
                                 ) : (
                                   <>
                                     <UserX className="h-4 w-4 mr-2" />
                                     Deactivate
                                   </>
                                 )}
                               </Button>
                               {user.banned_until && (
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => handleDeleteUser(user.id)}
                                   disabled={deletingUserId === user.id}
                                 >
                                   {deletingUserId === user.id ? (
                                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                   ) : (
                                     <Trash2 className="h-4 w-4 mr-2" />
                                   )}
                                   Delete
                                 </Button>
                               )}
                             </>
                           )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <UserAnalytics />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditLogs />
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
