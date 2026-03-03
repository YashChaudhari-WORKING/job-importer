"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import {
  History,
  Rss,
  Briefcase,
  LogOut,
  Zap,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "Import History", icon: History },
  { href: "/dashboard/feeds", label: "Manage Feeds", icon: Rss },
  { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
];

function CronTimer() {
  const [nextRun, setNextRun] = useState(null);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const fetchCronStatus = async () => {
      try {
        const { data } = await api.get("/cron-status");
        setNextRun(new Date(data.nextRun));
      } catch {
        // silently fail
      }
    };
    fetchCronStatus();
    const fetchInterval = setInterval(fetchCronStatus, 60000);
    return () => clearInterval(fetchInterval);
  }, []);

  useEffect(() => {
    if (!nextRun) return;

    const tick = () => {
      const now = new Date();
      const diff = nextRun - now;

      if (diff <= 0) {
        setCountdown("Running...");
        // Refetch after a short delay since cron just triggered
        setTimeout(() => {
          api.get("/cron-status").then(({ data }) => {
            setNextRun(new Date(data.nextRun));
          }).catch(() => {});
        }, 5000);
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins}m ${secs}s`);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [nextRun]);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-accent/50 px-3 py-2 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      <div>
        <p className="font-medium text-foreground/80">Next Import</p>
        <p className="tabular-nums">{countdown || "Loading..."}</p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Job Importer</span>
      </div>

      <Separator />

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Cron Timer */}
      <div className="px-3 pb-2">
        <CronTimer />
      </div>

      <Separator />

      {/* User + Logout */}
      <div className="px-3 py-4">
        <div className="flex items-center justify-between rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium truncate max-w-[120px]">
              {user?.name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
