import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Users, Ticket, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfYear } from "date-fns";

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
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"30days" | "ytd">("30days");
  const [stats, setStats] = useState<TicketStats>({ total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [assigneeData, setAssigneeData] = useState<UserData[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.is_admin || profile?.is_helpdesk) {
      fetchAnalytics();
    }
  }, [period, profile]);

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
            email
          ),
          assigned_user:profiles!tickets_assigned_to_fkey (
            full_name,
            email
          )
        `)
        .gte("created_at", dateFilter)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate stats
      const ticketStats: TicketStats = {
        total: tickets?.length || 0,
        open: tickets?.filter(t => t.status === "open").length || 0,
        in_progress: tickets?.filter(t => t.status === "in_progress").length || 0,
        resolved: tickets?.filter(t => t.status === "resolved").length || 0,
        closed: tickets?.filter(t => t.status === "closed").length || 0,
      };
      setStats(ticketStats);

      // Calculate category data
      const categoryMap = new Map<string, number>();
      tickets?.forEach(ticket => {
        const count = categoryMap.get(ticket.category) || 0;
        categoryMap.set(ticket.category, count + 1);
      });
      const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      setCategoryData(categories);

      // Calculate user data (ticket creators)
      const userMap = new Map<string, { name: string; created: number }>();
      tickets?.forEach(ticket => {
        const userName = ticket.creator?.full_name || ticket.creator?.email || "Unknown";
        const existing = userMap.get(userName) || { name: userName, created: 0 };
        userMap.set(userName, { ...existing, created: existing.created + 1 });
      });
      const users = Array.from(userMap.values())
        .sort((a, b) => b.created - a.created)
        .slice(0, 10);
      setUserData(users);

      // Calculate assignee data
      const assigneeMap = new Map<string, { name: string; assigned: number }>();
      tickets?.forEach(ticket => {
        if (ticket.assigned_to && ticket.assigned_user) {
          const assigneeName = ticket.assigned_user.full_name || ticket.assigned_user.email;
          const existing = assigneeMap.get(assigneeName) || { name: assigneeName, assigned: 0 };
          assigneeMap.set(assigneeName, { ...existing, assigned: existing.assigned + 1 });
        }
      });
      const assignees = Array.from(assigneeMap.values())
        .sort((a, b) => b.assigned - a.assigned);
      setAssigneeData(assignees);

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
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closed}</div>
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
                <Bar dataKey="created" fill="#82ca9d" name="Tickets Created" />
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
      </div>
    </div>
  );
};

export default Analytics;
