import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, User, FileEdit } from "lucide-react";
import { format, subDays, startOfYear } from "date-fns";

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  created_at: string;
}

type TimeFilter = "today" | "7days" | "30days" | "ytd" | "all";

export const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7days");

  useEffect(() => {
    fetchLogs();
  }, [timeFilter]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeFilter) {
      case "today":
        return subDays(now, 1).toISOString();
      case "7days":
        return subDays(now, 7).toISOString();
      case "30days":
        return subDays(now, 30).toISOString();
      case "ytd":
        return startOfYear(now).toISOString();
      case "all":
        return null;
      default:
        return subDays(now, 7).toISOString();
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const dateFilter = getDateFilter();

      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (dateFilter) {
        query = query.gte("created_at", dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatChanges = (log: AuditLog) => {
    if (!log.old_values && !log.new_values) return null;

    const changes: string[] = [];

    if (log.action === "created") {
      return "Record created";
    }

    if (log.action === "deleted") {
      return "Record deleted";
    }

    if (log.old_values && log.new_values) {
      Object.keys(log.new_values).forEach((key) => {
        if (log.old_values[key] !== log.new_values[key]) {
          changes.push(`${key}: "${log.old_values[key]}" → "${log.new_values[key]}"`);
        }
      });
    }

    return changes.length > 0 ? changes.join(", ") : "Updated";
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "created":
      case "insert":
        return "default";
      case "updated":
      case "update":
        return "secondary";
      case "deleted":
      case "delete":
        return "destructive";
      default:
        return "outline";
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">System Activity Log</h3>
          <p className="text-sm text-muted-foreground">
            Track all changes made in the system
          </p>
        </div>
        <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="ytd">Year to date</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileEdit className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No activity logs</p>
            <p className="text-sm text-muted-foreground">
              No changes recorded for the selected period
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{log.user_email || "System"}</span>
                      <Badge variant={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        in {log.table_name}
                      </span>
                    </div>
                    {formatChanges(log) && (
                      <p className="text-sm text-muted-foreground pl-6">
                        {formatChanges(log)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};