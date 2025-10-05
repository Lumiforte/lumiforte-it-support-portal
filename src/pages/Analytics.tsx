import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Users, Ticket, CheckCircle, Building2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfYear } from "date-fns";
import { COMPANIES, getCompanyColor } from "@/lib/companies";

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

interface CategoryData {
  name: string;
  count: number;
}

interface UserData {
  name: string;
  created?: number;
  assigned?: number;
  company?: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"30days" | "ytd">("30days");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [stats, setStats] = useState<TicketStats>({ total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [assigneeData, setAssigneeData] = useState<UserData[]>([]);
  const [companyData, setCompanyData] = useState<CategoryData[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.is_admin || profile?.is_helpdesk) {
      fetchAnalytics();
    }
  }, [period, selectedCompanies, profile]);

  const getDateFilter = () => {
    const now = new Date();
    if (period === "30days") {
      return subDays(now, 30).toISOString();
    } else {
      return startOfYear(now).toISOString();
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const dateFilter = getDateFilter();

      // Fetch all tickets for the period
      const { data: tickets, error } = await supabase
        .from("tickets")
        .select(`
          *,
          creator:profiles!tickets_created_by_fkey (
            full_name,
            email,
            company
          ),
          assigned_user:profiles!tickets_assigned_to_fkey (
            full_name,
            email
          )
        `)
        .gte("created_at", dateFilter)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter by selected companies if any
      let filteredTickets = tickets || [];
      if (selectedCompanies.length > 0) {
        filteredTickets = filteredTickets.filter(t => 
          t.creator?.company && selectedCompanies.includes(t.creator.company)
        );
      }


      // Calculate stats
      const ticketStats: TicketStats = {
        total: filteredTickets?.length || 0,
        open: filteredTickets?.filter(t => t.status === "open").length || 0,
        in_progress: filteredTickets?.filter(t => t.status === "in_progress").length || 0,
        resolved: filteredTickets?.filter(t => t.status === "resolved").length || 0,
        closed: filteredTickets?.filter(t => t.status === "closed").length || 0,
      };
      setStats(ticketStats);

      // Calculate category data
      const categoryMap = new Map<string, number>();
      filteredTickets?.forEach(ticket => {
        const count = categoryMap.get(ticket.category) || 0;
        categoryMap.set(ticket.category, count + 1);
      });
      const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      setCategoryData(categories);

      // Calculate user data (ticket creators)
      const userMap = new Map<string, { name: string; created: number; company: string | null }>();
      filteredTickets?.forEach(ticket => {
        const userName = ticket.creator?.full_name || ticket.creator?.email || "Unknown";
        const userCompany = ticket.creator?.company || null;
        const existing = userMap.get(userName) || { name: userName, created: 0, company: userCompany };
        userMap.set(userName, { ...existing, created: existing.created + 1 });
      });
      const users = Array.from(userMap.values())
        .sort((a, b) => b.created - a.created)
        .slice(0, 10);
      setUserData(users);

      // Calculate assignee data
      const assigneeMap = new Map<string, { name: string; assigned: number }>();
      filteredTickets?.forEach(ticket => {
        if (ticket.assigned_to && ticket.assigned_user) {
          const assigneeName = ticket.assigned_user.full_name || ticket.assigned_user.email;
          const existing = assigneeMap.get(assigneeName) || { name: assigneeName, assigned: 0 };
          assigneeMap.set(assigneeName, { ...existing, assigned: existing.assigned + 1 });
        }
      });
      const assignees = Array.from(assigneeMap.values())
        .sort((a, b) => b.assigned - a.assigned);
      setAssigneeData(assignees);

      // Calculate company data
      const companyMap = new Map<string, number>();
      filteredTickets?.forEach(ticket => {
        const companyName = ticket.creator?.company || "Unknown / Not Set";
        const count = companyMap.get(companyName) || 0;
        companyMap.set(companyName, count + 1);
      });
      const companies = Array.from(companyMap.entries()).map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      setCompanyData(companies);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCompany = (companyValue: string) => {
    setSelectedCompanies(prev =>
      prev.includes(companyValue)
        ? prev.filter(c => c !== companyValue)
        : [...prev, companyValue]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusData = [
    { name: "Open", value: stats.open },
    { name: "In Progress", value: stats.in_progress },
    { name: "Resolved", value: stats.resolved },
    { name: "Closed", value: stats.closed },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Ticket Analytics</h1>
          <p className="text-muted-foreground">Overview of ticket statistics and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter by Company
                {selectedCompanies.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {selectedCompanies.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-popover z-50">
              <div className="space-y-2">
                <h4 className="font-medium text-sm mb-3">Select Companies</h4>
                {COMPANIES.map((company) => (
                  <div key={company.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`company-${company.value}`}
                      checked={selectedCompanies.includes(company.value)}
                      onCheckedChange={() => toggleCompany(company.value)}
                    />
                    <label
                      htmlFor={`company-${company.value}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {company.label}
                    </label>
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: company.color }}
                    />
                  </div>
                ))}
                {selectedCompanies.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => setSelectedCompanies([])}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Select value={period} onValueChange={(value: "30days" | "ytd") => setPeriod(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open & In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open + stats.in_progress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyData.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle>Top Ticket Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="created" name="Tickets Created">
                  {userData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCompanyColor(entry.company)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Assignees */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Assignee</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assigneeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="assigned" fill="#0088FE" name="Tickets Assigned" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Company Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Company</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={companyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={200} />
                <Tooltip />
                <Bar dataKey="count" fill="#FF8042" name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
