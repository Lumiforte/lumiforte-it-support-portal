import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Users, Ticket, CheckCircle, Building2, Filter, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfYear, differenceInHours, differenceInDays } from "date-fns";
import { COMPANIES, getCompanyColor } from "@/lib/companies";

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  avgResolutionTimeHours?: number;
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

interface ResolutionTimeData {
  range: string;
  count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Analytics = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"30days" | "ytd">("ytd");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(["ALL"]);
  const [stats, setStats] = useState<TicketStats>({ total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [assigneeData, setAssigneeData] = useState<UserData[]>([]);
  const [companyData, setCompanyData] = useState<CategoryData[]>([]);
  const [resolutionTimeData, setResolutionTimeData] = useState<ResolutionTimeData[]>([]);
  const [avgCategoryResolutionTime, setAvgCategoryResolutionTime] = useState<CategoryData[]>([]);
  const { toast } = useToast();

  // Security check - only allow admin or helpdesk
  if (!profile?.is_admin && !profile?.is_helpdesk) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground">
                You need admin or helpdesk privileges to access analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      // Filter by selected companies if any (except "ALL")
      let filteredTickets = tickets || [];
      if (selectedCompanies.length > 0 && !selectedCompanies.includes("ALL")) {
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

      // Calculate resolution time data
      const resolvedTickets = filteredTickets?.filter(t => t.resolved_at || t.closed_at) || [];
      const resolutionTimes: number[] = [];
      
      resolvedTickets.forEach(ticket => {
        const endDate = new Date(ticket.resolved_at || ticket.closed_at!);
        const startDate = new Date(ticket.created_at);
        const hoursToResolve = differenceInHours(endDate, startDate);
        resolutionTimes.push(hoursToResolve);
      });

      // Calculate average resolution time
      const avgResolutionTime = resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

      // Update stats with average resolution time
      setStats({
        ...ticketStats,
        avgResolutionTimeHours: avgResolutionTime
      });

      // Group by time ranges
      const timeRanges = [
        { range: "< 1 day", count: 0, max: 24 },
        { range: "1-3 days", count: 0, max: 72 },
        { range: "3-7 days", count: 0, max: 168 },
        { range: "1-2 weeks", count: 0, max: 336 },
        { range: "> 2 weeks", count: 0, max: Infinity }
      ];

      resolutionTimes.forEach(hours => {
        if (hours < 24) timeRanges[0].count++;
        else if (hours < 72) timeRanges[1].count++;
        else if (hours < 168) timeRanges[2].count++;
        else if (hours < 336) timeRanges[3].count++;
        else timeRanges[4].count++;
      });

      setResolutionTimeData(timeRanges.filter(r => r.count > 0));

      // Calculate average resolution time per category
      const categoryResolutionMap = new Map<string, { total: number; count: number }>();
      resolvedTickets.forEach(ticket => {
        const endDate = new Date(ticket.resolved_at || ticket.closed_at!);
        const startDate = new Date(ticket.created_at);
        const daysToResolve = differenceInDays(endDate, startDate);
        
        const existing = categoryResolutionMap.get(ticket.category) || { total: 0, count: 0 };
        categoryResolutionMap.set(ticket.category, {
          total: existing.total + daysToResolve,
          count: existing.count + 1
        });
      });

      const categoryResolution = Array.from(categoryResolutionMap.entries())
        .map(([name, data]) => ({
          name,
          count: Math.round(data.total / data.count * 10) / 10 // Average days, rounded to 1 decimal
        }))
        .sort((a, b) => b.count - a.count);
      setAvgCategoryResolutionTime(categoryResolution);


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
    setSelectedCompanies(prev => {
      // If clicking "ALL", clear others and select only ALL
      if (companyValue === "ALL") {
        return ["ALL"];
      }
      
      // Remove "ALL" if selecting a specific company
      const withoutAll = prev.filter(c => c !== "ALL");
      
      if (withoutAll.includes(companyValue)) {
        const newSelection = withoutAll.filter(c => c !== companyValue);
        // If nothing selected, default back to ALL
        return newSelection.length === 0 ? ["ALL"] : newSelection;
      } else {
        return [...withoutAll, companyValue];
      }
    });
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
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    id="company-ALL"
                    checked={selectedCompanies.includes("ALL")}
                    onCheckedChange={() => toggleCompany("ALL")}
                  />
                  <label
                    htmlFor="company-ALL"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    All Companies
                  </label>
                </div>
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
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgResolutionTimeHours !== undefined && stats.avgResolutionTimeHours > 0
                ? stats.avgResolutionTimeHours < 48
                  ? `${Math.round(stats.avgResolutionTimeHours)}h`
                  : `${Math.round(stats.avgResolutionTimeHours / 24)}d`
                : "N/A"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              For resolved tickets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Time Card */}
      {resolutionTimeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resolution Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={resolutionTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

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

        {/* Average Resolution Time by Category */}
        {avgCategoryResolutionTime.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Avg Resolution Time by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={avgCategoryResolutionTime} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value) => `${value} days`} />
                  <Bar dataKey="count" fill="#FFBB28" name="Avg Days to Resolve" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Analytics;
