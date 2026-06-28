import { useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Gift, Users, Wallet, User, Sun, Moon, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useListNotifications } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: notifData, refetch: refetchNotifs } = useListNotifications({
    query: { enabled: !!user, refetchInterval: 30000 },
  } as any);

  const unreadCount = notifData
    ? notifData.filter(n => !n.isRead).length
    : 0;

  // Track previously seen notifications and show toast on new ones
  const seenIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!notifData) return;
    const allNotifs = notifData;

    if (isFirstLoadRef.current) {
      // On first load, just mark everything as seen (don't toast)
      allNotifs.forEach(n => seenIdsRef.current.add(n.id));
      isFirstLoadRef.current = false;
      return;
    }

    // New notifications since last check
    const newOnes = allNotifs.filter(n => !seenIdsRef.current.has(n.id));
    newOnes.forEach(n => {
      seenIdsRef.current.add(n.id);
      toast({
        title: n.title,
        description: n.message,
        className: n.type === "deposit" || n.type === "membership"
          ? "bg-green-700 text-white border-none"
          : "bg-blue-700 text-white border-none",
        duration: 6000,
      });
    });
  }, [notifData]);

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/games", icon: Gamepad2, label: "Games" },
    { href: "/rewards", icon: Gift, label: "Rewards" },
    { href: "/referral", icon: Users, label: "Referral" },
    { href: "/wallet", icon: Wallet, label: "Wallet" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 dark:border-white/5 h-16 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
            P
          </div>
          <span className="font-display font-bold text-xl tracking-tight hidden sm:inline-block">Play<span className="text-primary">9ja</span></span>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <Link href="/notifications">
            <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none animate-bounce">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border p-4 gap-2 sticky top-16 h-[calc(100vh-4rem)]">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                {item.label}
              </Link>
            );
          })}
          <Link href="/notifications" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location === '/notifications' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            Notifications
          </Link>
        </aside>

        {/* Page Content */}
        <main className="flex-1 w-full pb-20 md:pb-0 relative min-h-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/10 dark:border-white/5 pb-safe">
        <div className="flex items-center justify-around px-2 h-16">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href === "/games" && location.startsWith("/games"));
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center w-full h-full gap-1">
                <div className={`p-1.5 rounded-full transition-all ${isActive ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
