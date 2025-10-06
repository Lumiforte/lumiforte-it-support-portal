import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Users, UserCheck, UserX, Activity, Calendar, Trophy } from "lucide-react";
import { formatDistanceToNow, format, subDays, startOfDay, endOfDay, isToday, isYesterday } from "date-fns";

interface UserStats {
  totalUsers: number;
  neverLoggedIn: number;
  loggedInOnce: number;
  activeUsers: number;
  todayLogins: number;
  yesterdayLogins: number;
  last7DaysLogins: number;
  last30DaysLogins: number;
}

interface UserEngagement {
  user_id: string;
  email: string;
  full_name: string | null;
  login_count: number;
  last_login: string | null;
  created_at: string;
  ticket_count: number;
}

const UserAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    neverLoggedIn: 0,
    loggedInOnce: 0,
    activeUsers: 0,
    todayLogins: 0,
    yesterdayLogins: 0,
    last7DaysLogins: 0,
    last30DaysLogins: 0,
  });
  const [leaderboard, setLeaderboard] = useState<UserEngagement[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Get all users from auth and profiles
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at');

      if (!authUsers || !profiles) return;

      const now = new Date();
      const today = startOfDay(now);
      const yesterday = startOfDay(subDays(now, 1));
      const sevenDaysAgo = startOfDay(subDays(now, 7));
      const thirtyDaysAgo = startOfDay(subDays(now, 30));

      let neverLoggedIn = 0;
      let loggedInOnce = 0;
      let activeUsers = 0;
      let todayLogins = 0;
      let yesterdayLogins = 0;
      let last7DaysLogins = 0;
      let last30DaysLogins = 0;

      const userEngagementMap = new Map<string, UserEngagement>();

      // Process all users
      for (const authUser of authUsers.users) {
        const profile = profiles.find(p => p.id === authUser.id);
        const lastSignIn = authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at) : null;

        // Count logins by period
        if (lastSignIn) {
          if (lastSignIn >= today) todayLogins++;
          if (lastSignIn >= yesterday && lastSignIn < today) yesterdayLogins++;
          if (lastSignIn >= sevenDaysAgo) last7DaysLogins++;
          if (lastSignIn >= thirtyDaysAgo) last30DaysLogins++;

          // Active users: logged in at least once in last 30 days
          if (lastSignIn >= thirtyDaysAgo) {
            activeUsers++;
          }
        }

        // Never logged in vs logged in once
        if (!lastSignIn) {
          neverLoggedIn++;
        } else {
          loggedInOnce++;
        }

        // Store for leaderboard calculation
        userEngagementMap.set(authUser.id, {
          user_id: authUser.id,
          email: authUser.email || '',
          full_name: profile?.full_name || null,
          login_count: 0, // Will be calculated from auth logs
          last_login: authUser.last_sign_in_at,
          created_at: profile?.created_at || authUser.created_at,
          ticket_count: 0, // Will be calculated from tickets
        });
      }

      // Get ticket counts per user
      const { data: ticketCounts } = await supabase
        .from('tickets')
        .select('created_by');

      if (ticketCounts) {
        const ticketCountMap = new Map<string, number>();
        ticketCounts.forEach(ticket => {
          ticketCountMap.set(
            ticket.created_by,
            (ticketCountMap.get(ticket.created_by) || 0) + 1
          );
        });

        // Update engagement map with ticket counts
        ticketCountMap.forEach((count, userId) => {
          const engagement = userEngagementMap.get(userId);
          if (engagement) {
            engagement.ticket_count = count;
          }
        });
      }

      // Query auth logs to get more accurate login counts (this is an approximation)
      // Since we don't have direct access to detailed auth logs, we'll use available data
      const engagementList = Array.from(userEngagementMap.values())
        .sort((a, b) => {
          // Sort by a combination of factors: tickets created + has logged in recently
          const aScore = a.ticket_count * 10 + (a.last_login ? 5 : 0);
          const bScore = b.ticket_count * 10 + (b.last_login ? 5 : 0);
          return bScore - aScore;
        })
        .slice(0, 20); // Top 20 users

      setStats({
        totalUsers: authUsers.users.length,
        neverLoggedIn,
        loggedInOnce,
        activeUsers,
        todayLogins,
        yesterdayLogins,
        last7DaysLogins,
        last30DaysLogins,
      });

      setLeaderboard(engagementList);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (30d)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 
                ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total`
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Never Logged In</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.neverLoggedIn}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0
                ? `${Math.round((stats.neverLoggedIn / stats.totalUsers) * 100)}% of total`
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Has Logged In</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.loggedInOnce}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0
                ? `${Math.round((stats.loggedInOnce / stats.totalUsers) * 100)}% of total`
                : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Login Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Login Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Today</p>
              <p className="text-2xl font-bold">{stats.todayLogins}</p>
              <p className="text-xs text-muted-foreground">logins</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Yesterday</p>
              <p className="text-2xl font-bold">{stats.yesterdayLogins}</p>
              <p className="text-xs text-muted-foreground">logins</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Last 7 Days</p>
              <p className="text-2xl font-bold">{stats.last7DaysLogins}</p>
              <p className="text-xs text-muted-foreground">logins</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Last 30 Days</p>
              <p className="text-2xl font-bold">{stats.last30DaysLogins}</p>
              <p className="text-xs text-muted-foreground">logins</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            User Engagement Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard.map((user, index) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">
                      {user.full_name || user.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {user.ticket_count} {user.ticket_count === 1 ? 'ticket' : 'tickets'}
                    </div>
                    {user.last_login ? (
                      <div className="text-xs text-muted-foreground">
                        Last login: {formatDistanceToNow(new Date(user.last_login), { addSuffix: true })}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Never logged in
                      </Badge>
                    )}
                  </div>
                  {index < 3 && (
                    <Badge variant="secondary" className="ml-2">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No user activity data available yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserAnalytics;
