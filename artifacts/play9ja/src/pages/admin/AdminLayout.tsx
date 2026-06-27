import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, CreditCard, ArrowDownCircle, ArrowUpCircle,
  Gamepad2, Bell, Settings, MessageSquare, LogOut, Shield, Menu, X, PackageOpen, Receipt
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PendingCounts {
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingMemberships: number;
}

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [counts, setCounts] = useState<PendingCounts>({ pendingDeposits: 0, pendingWithdrawals: 0, pendingMemberships: 0 });
  const prevCounts = useRef<PendingCounts>({ pendingDeposits: 0, pendingWithdrawals: 0, pendingMemberships: 0 });
  const { toast } = useToast();

  const fetchCounts = async () => {
    try {
      const token = localStorage.getItem("play9ja_token");
      const res = await fetch(`${BASE}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const next: PendingCounts = {
        pendingDeposits: data.pendingDeposits ?? 0,
        pendingWithdrawals: data.pendingWithdrawals ?? 0,
        pendingMemberships: data.pendingMemberships ?? 0,
      };

      const prev = prevCounts.current;
      if (prev.pendingDeposits !== 0 || prev.pendingWithdrawals !== 0 || prev.pendingMemberships !== 0) {
        if (next.pendingDeposits > prev.pendingDeposits) {
          toast({ title: "💰 New Deposit Request", description: `${next.pendingDeposits - prev.pendingDeposits} new deposit(s) need review.` });
        }
        if (next.pendingWithdrawals > prev.pendingWithdrawals) {
          toast({ title: "🏦 New Withdrawal Request", description: `${next.pendingWithdrawals - prev.pendingWithdrawals} new withdrawal(s) need processing.` });
        }
        if (next.pendingMemberships > prev.pendingMemberships) {
          toast({ title: "🎖️ New Membership Request", description: `${next.pendingMemberships - prev.pendingMemberships} new membership(s) need approval.` });
        }
      }

      prevCounts.current = next;
      setCounts(next);
    } catch {
    }
  };

  useEffect(() => {
    fetchCounts();
    const id = setInterval(fetchCounts, 30_000);
    return () => clearInterval(id);
  }, []);

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard, badge: 0 },
    { path: "/admin/users", label: "Users", icon: Users, badge: 0 },
    { path: "/admin/memberships", label: "Memberships", icon: CreditCard, badge: counts.pendingMemberships },
    { path: "/admin/plans", label: "Plans", icon: PackageOpen, badge: 0 },
    { path: "/admin/deposits", label: "Deposits", icon: ArrowDownCircle, badge: counts.pendingDeposits },
    { path: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpCircle, badge: counts.pendingWithdrawals },
    { path: "/admin/games", label: "Games", icon: Gamepad2, badge: 0 },
    { path: "/admin/transactions", label: "Transactions", icon: Receipt, badge: 0 },
    { path: "/admin/notifications", label: "Broadcast", icon: Bell, badge: 0 },
    { path: "/admin/activity", label: "Activity Feed", icon: MessageSquare, badge: 0 },
    { path: "/admin/settings", label: "Settings", icon: Settings, badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm font-display">Play9ja</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <Link key={item.path} href={item.path}>
              <a className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                location === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )} onClick={() => setSidebarOpen(false)}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {item.badge > 0 && (
                  <span className={cn(
                    "ml-auto min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center",
                    location === item.path
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-destructive text-destructive-foreground"
                  )}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </a>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-all">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 md:ml-64 min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-foreground font-display">
            {navItems.find(n => n.path === location)?.label ?? "Admin"}
          </h1>
          {/* Pending summary in header */}
          <div className="ml-auto flex items-center gap-2">
            {counts.pendingDeposits > 0 && (
              <Link href="/admin/deposits">
                <a className="text-xs bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 rounded-full px-2.5 py-1 font-medium hover:bg-cyan-500/20 transition-colors">
                  {counts.pendingDeposits} deposit{counts.pendingDeposits !== 1 ? "s" : ""}
                </a>
              </Link>
            )}
            {counts.pendingWithdrawals > 0 && (
              <Link href="/admin/withdrawals">
                <a className="text-xs bg-red-500/10 text-red-600 border border-red-500/20 rounded-full px-2.5 py-1 font-medium hover:bg-red-500/20 transition-colors">
                  {counts.pendingWithdrawals} withdrawal{counts.pendingWithdrawals !== 1 ? "s" : ""}
                </a>
              </Link>
            )}
            {counts.pendingMemberships > 0 && (
              <Link href="/admin/memberships">
                <a className="text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full px-2.5 py-1 font-medium hover:bg-amber-500/20 transition-colors">
                  {counts.pendingMemberships} membership{counts.pendingMemberships !== 1 ? "s" : ""}
                </a>
              </Link>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
