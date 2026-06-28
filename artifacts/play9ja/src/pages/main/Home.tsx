import { useGetDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Wallet, Star, Gift, Gamepad2, ArrowRight, Users, ArrowDownToLine, Trophy, Zap, Crown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import LiveActivityTicker from "@/components/LiveActivityTicker";

function GreetingTime(username: string) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  return `${greet}, ${username}! 👋`;
}

const TOP_WITHDRAWERS = [
  { name: "Elizabeth O.", amount: 850000, premium: true },
  { name: "Chidi S.", amount: 720000, premium: true },
  { name: "Yetunde S.", amount: 640000, premium: true },
  { name: "Peter A.", amount: 510000, premium: false },
  { name: "Amara O.", amount: 480000, premium: true },
];

function seededRand(seed: number, min: number, max: number) {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return min + (seed % (max - min + 1));
}

export default function Home() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetDashboard(undefined, { query: { enabled: !!user } } as any);
  const [animBalance, setAnimBalance] = useState(0);

  const seed = useMemo(() => Math.floor(Date.now() / (30 * 60 * 1000)), []);
  const miniLeaders = useMemo(() =>
    TOP_WITHDRAWERS.map((u, i) => ({
      ...u,
      amount: u.amount + seededRand(seed + i * 13, -30000, 80000),
    })).sort((a, b) => b.amount - a.amount),
    [seed]
  );

  useEffect(() => {
    if (!dashboard) return;
    const target = dashboard.wallet.total;
    if (target === 0) return;
    const step = target / 30;
    let curr = 0;
    const id = setInterval(() => {
      curr = Math.min(curr + step, target);
      setAnimBalance(Math.floor(curr));
      if (curr >= target) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [dashboard?.wallet.total]);

  if (isLoading || !dashboard) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-in fade-in">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-10 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  const totalBalance = dashboard.wallet.total;
  const hasBalance = totalBalance > 0;
  const hasMembership = dashboard.membership.isActive;
  const showTopUpBanner = !hasBalance && !hasMembership;

  return (
    <div className="p-4 md:p-8 space-y-5 pb-24">
      {/* Greeting */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
            {GreetingTime(user?.username ?? "there")}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Ready to earn today?</p>
        </div>
        <Link href="/notifications">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer">
            🔔
          </div>
        </Link>
      </div>

      {/* Live Activity Ticker */}
      <LiveActivityTicker />

      {/* Low balance alert */}
      {showTopUpBanner && (
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-500">
          <div className="text-2xl">⚡</div>
          <div className="flex-1">
            <p className="font-bold text-sm">Your balance is empty!</p>
            <p className="text-xs text-muted-foreground">Deposit or get a membership to start earning.</p>
          </div>
          <Link href="/wallet">
            <Button size="sm" className="rounded-xl h-8 text-xs gold-gradient text-black border-none font-bold shrink-0">
              Top Up
            </Button>
          </Link>
        </div>
      )}

      {/* Main Wallet Card */}
      <Card className="rounded-3xl border-none shadow-2xl overflow-hidden relative bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/50 via-primary/20 to-transparent" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-6 md:p-8 relative z-10">
          <div className="flex justify-between items-start mb-5">
            <div>
              <span className="text-white/70 text-sm font-medium">Total Balance</span>
              <div className="text-4xl md:text-5xl font-display font-bold mt-1">
                ₦{animBalance.toLocaleString()}
              </div>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
              <Wallet className="text-primary w-6 h-6" />
            </div>
          </div>
          <div className="flex gap-4 text-sm mb-6">
            <div>
              <span className="text-white/60 text-xs">Withdrawable</span>
              <div className="font-bold text-white">₦{dashboard.wallet.withdrawable.toLocaleString()}</div>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <span className="text-white/60 text-xs">Game Earnings</span>
              <div className="font-bold text-green-400">₦{dashboard.wallet.game.toLocaleString()}</div>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <span className="text-white/60 text-xs">Pending</span>
              <div className="font-bold text-amber-400">₦{dashboard.wallet.pending.toLocaleString()}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/wallet" className="flex-1">
              <Button className="w-full h-11 rounded-xl bg-white text-black hover:bg-white/90 font-bold text-sm">
                <ArrowDownToLine className="w-4 h-4 mr-1.5" /> Deposit
              </Button>
            </Link>
            <Link href="/wallet" className="flex-1">
              <Button variant="outline" className="w-full h-11 rounded-xl border-white/30 text-white hover:bg-white/10 font-bold text-sm">
                Withdraw
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Membership + Daily Reward */}
      <div className="grid grid-cols-2 gap-3">
        {dashboard.membership.isActive ? (
          <div className="gold-gradient rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-bold text-sm">{dashboard.membership.planName}</span>
            </div>
            <div className="text-xs font-medium opacity-80">
              {dashboard.membership.daysRemaining}d {dashboard.membership.hoursRemaining}h left
            </div>
          </div>
        ) : (
          <Link href="/membership">
            <div className="bg-card border border-dashed border-primary/40 rounded-2xl p-4 flex flex-col justify-center hover:shadow-md hover:border-primary transition-all cursor-pointer h-full">
              <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                <Star className="w-4 h-4" />
                <span className="font-medium text-sm">Membership</span>
              </div>
              <div className="text-sm font-bold text-primary">Upgrade Now ↗</div>
            </div>
          </Link>
        )}

        <Link href="/rewards">
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-center hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
              <Gift className="w-4 h-4" />
              <span className="font-medium text-sm">Daily Reward</span>
            </div>
            <div className="text-sm font-bold text-primary">🎁 Claim Now</div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-display font-bold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {[
            { href: "/games", icon: Gamepad2, label: "Play", color: "bg-blue-500/10 text-blue-500" },
            { href: "/wallet", icon: ArrowDownToLine, label: "Deposit", color: "bg-green-500/10 text-green-500" },
            { href: "/referral", icon: Users, label: "Refer", color: "bg-purple-500/10 text-purple-500" },
            { href: "/leaderboard", icon: Trophy, label: "Ranks", color: "bg-amber-500/10 text-amber-500" },
          ].map((action, i) => (
            <Link key={i} href={action.href} className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${action.color} hover:scale-110 transition-transform shadow-sm`}>
                <action.icon className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <span className="text-xs font-semibold text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mini Leaderboard — Top Withdrawers */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Top Withdrawers
          </h2>
          <Link href="/leaderboard" className="text-sm font-medium text-primary flex items-center gap-1 hover:underline">
            Full Board <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <Card className="rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {miniLeaders.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                <div className={`w-7 text-center font-display font-bold text-sm shrink-0 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </div>
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-bold text-sm text-primary">
                    {entry.name.charAt(0)}
                  </div>
                  {entry.premium && <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400 absolute -top-0.5 -right-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate">{entry.name}</span>
                    {entry.premium && <span className="text-[10px] font-bold bg-yellow-500/15 text-yellow-500 px-1.5 py-0.5 rounded-full shrink-0">PRO</span>}
                  </div>
                </div>
                <div className="font-bold text-sm text-primary shrink-0">
                  ₦{entry.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Daily Missions */}
      {dashboard.dailyMissions.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-display font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Daily Missions
            </h2>
          </div>
          <div className="space-y-2">
            {dashboard.dailyMissions.slice(0, 3).map((mission: any) => (
              <div key={mission.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${mission.isCompleted ? "bg-green-500/5 border-green-500/20" : "bg-card border-border"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${mission.isCompleted ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                  {mission.isCompleted ? "✅" : "🎯"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{mission.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{mission.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${mission.isCompleted ? "text-green-500" : "text-primary"}`}>
                    ₦{mission.reward.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{mission.progress}/{mission.target}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-display font-bold">Recent Activity</h2>
          <Link href="/wallet" className="text-sm font-medium text-primary flex items-center gap-1 hover:underline">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <Card className="rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {dashboard.recentTransactions.length > 0 ? dashboard.recentTransactions.slice(0, 4).map((tx: any) => (
              <div key={tx.id} className="p-3.5 flex justify-between items-center hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${tx.amount > 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    {tx.amount > 0 ? "↓" : "↑"}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{tx.description}</div>
                    <div className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className={`font-bold text-sm ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                  {tx.amount > 0 ? "+" : ""}₦{Math.abs(tx.amount).toLocaleString()}
                </div>
              </div>
            )) : (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">💳</div>
                <p className="text-muted-foreground text-sm">No transactions yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
