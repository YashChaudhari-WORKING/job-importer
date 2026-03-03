"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ImportHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/imports/logs?page=${page}&limit=10`);
      setLogs(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toast.error("Failed to fetch import logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => fetchLogs(pagination.page), 30000);
    return () => clearInterval(interval);
  }, [fetchLogs, pagination.page]);

  const triggerImport = async () => {
    setTriggering(true);
    try {
      const { data } = await api.post("/imports/trigger");
      toast.success(data.message);
      setTimeout(() => fetchLogs(pagination.page), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to trigger import");
    } finally {
      setTriggering(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const truncateUrl = (url, maxLen = 45) => {
    if (!url) return "";
    return url.length > maxLen ? url.substring(0, maxLen) + "..." : url;
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: "default",
      processing: "secondary",
      pending: "outline",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Import History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all job import runs and their results
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(pagination.page)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={triggerImport} disabled={triggering}>
            {triggering ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Import
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">fileName</TableHead>
              <TableHead>importDateTime</TableHead>
              <TableHead>status</TableHead>
              <TableHead className="text-center">total</TableHead>
              <TableHead className="text-center">new</TableHead>
              <TableHead className="text-center">updated</TableHead>
              <TableHead className="text-center">failed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No import logs yet. Click &quot;Run Import&quot; to start.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="font-mono text-xs" title={log.fileName}>
                    {truncateUrl(log.fileName)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(log.importDateTime)}
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="text-center font-medium">
                    {log.totalImported}
                  </TableCell>
                  <TableCell className="text-center font-medium text-emerald-500">
                    {log.newJobs}
                  </TableCell>
                  <TableCell className="text-center font-medium text-blue-500">
                    {log.updatedJobs}
                  </TableCell>
                  <TableCell className="text-center font-medium text-red-400">
                    {log.failedJobs}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
