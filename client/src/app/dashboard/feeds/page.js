"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ManageFeedsPage() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchFeeds = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/feeds");
      setFeeds(data.data);
    } catch {
      toast.error("Failed to fetch feeds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const addFeed = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/feeds", { url: newUrl, name: newName });
      toast.success("Feed added successfully");
      setNewUrl("");
      setNewName("");
      setOpen(false);
      fetchFeeds();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add feed");
    } finally {
      setAdding(false);
    }
  };

  const toggleFeed = async (id) => {
    try {
      await api.patch(`/feeds/${id}`);
      setFeeds((prev) =>
        prev.map((f) => (f._id === id ? { ...f, isActive: !f.isActive } : f))
      );
    } catch {
      toast.error("Failed to toggle feed");
    }
  };

  const deleteFeed = async (id) => {
    if (!confirm("Are you sure you want to delete this feed?")) return;
    try {
      await api.delete(`/feeds/${id}`);
      toast.success("Feed deleted");
      setFeeds((prev) => prev.filter((f) => f._id !== id));
    } catch {
      toast.error("Failed to delete feed");
    }
  };

  const formatDate = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Feeds</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add, enable/disable, or remove RSS feed sources
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Feed
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Feed</DialogTitle>
            </DialogHeader>
            <form onSubmit={addFeed} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="feedName">Feed Name</Label>
                <Input
                  id="feedName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jobicy - Data Science"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedUrl">Feed URL</Label>
                <Input
                  id="feedUrl"
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/rss/feed"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={adding}>
                {adding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Feed
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feed Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[320px]">URL</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Last Fetched</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading...
                </TableCell>
              </TableRow>
            ) : feeds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No feeds added yet. Click &quot;Add Feed&quot; to get started.
                </TableCell>
              </TableRow>
            ) : (
              feeds.map((feed) => (
                <TableRow key={feed._id}>
                  <TableCell className="font-medium">{feed.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground" title={feed.url}>
                    {feed.url.length > 50 ? feed.url.substring(0, 50) + "..." : feed.url}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={feed.isActive}
                        onCheckedChange={() => toggleFeed(feed._id)}
                      />
                      <Badge variant={feed.isActive ? "default" : "secondary"}>
                        {feed.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(feed.lastFetchedAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteFeed(feed._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        {feeds.filter((f) => f.isActive).length} of {feeds.length} feeds active
      </p>
    </div>
  );
}
