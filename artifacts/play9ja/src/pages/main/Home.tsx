import { useGetDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Wallet, Star, Gift, Gamepad2, ArrowRight, Users } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetDashboard({
    query: {
      enabled: !!user,
    }
  });

  if (isLoading || !dashboard) {
    return (
      <div className="p-4 md:p-8 space-y-6 animate-in fade-in">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24">
      {/* Greeting */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
            Good Morning, {user?.username}
          </h1>
          <p className="text-muted-foreground">Ready to earn today?</p>
        </div>
      </div>

      {/* Main Wallet Card */}
      <Card className="rounded-3xl border-none shadow-xl overflow-hidden relative bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent opacity-50"></div>
        <CardContent className="p-6 md:p-8 relative z-10 flex flex-col justify-between h-full min-h-[160px]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white/80 font-medium">Total Balance</span>
            <Wallet className="text-primary w-6 h-6" />
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-display font-bold">
              ₦{dashboard.wallet.total.toLocaleString()}
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <div>
                <span className="text-white/60">Withdrawable</span>
                <div className="font-bold text-white">₦{dashboard.wallet.withdrawable.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-white/60">Pending</span>
                <div className="font-bold text-yellow-400">₦{dashboard.wallet.pending.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {dashboard.membership.isActive ? (
          <div className="gold-gradient rounded-2xl p-4 flex flex-col justify-center shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-bold text-sm">Weekly Member</span>
            </div>
            <div className="text-xs font-medium opacity-80">
              {dashboard.membership.daysRemaining} Days {dashboard.membership.hoursRemaining} Hours remaining
            </div>
          </div>
        ) : (
          <Link href="/membership">
            <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                <Star className="w-4 h-4" />
                <span className="font-medium text-sm">Membership</span>
              </div>
              <div className="text-sm font-bold text-primary">Upgrade Now</div>
            </div>
          </Link>
        )}

        <Link href="/rewards">
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
              <Gift className="w-4 h-4" />
              <span className="font-medium text-sm">Daily Reward</span>
            </div>
            <div className="text-sm font-bold text-accent">Claim Available</div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-bold">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {[
            { href: "/games", icon: Gamepad2, label: "Play Games", color: "bg-blue-500/10 text-blue-500" },
            { href: "/wallet", icon: Wallet, label: "Deposit", color: "bg-green-500/10 text-green-500" },
            { href: "/referral", icon: Users, label: "Refer", color: "bg-purple-500/10 text-purple-500" },
            { href: "/rewards", icon: Gift, label: "Missions", color: "bg-orange-500/10 text-orange-500" },
          ].map((action, i) => (
            <Link key={i} href={action.href} className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${action.color} hover:scale-105 transition-transform`}>
                <action.icon className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <span className="text-xs font-medium text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-bold">Recent Transactions</h2>
          <Link href="/wallet" className="text-sm font-medium text-primary flex items-center gap-1 hover:underline">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <Card className="rounded-2xl border-none shadow-sm bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {dashboard.recentTransactions.length > 0 ? dashboard.recentTransactions.slice(0,3).map((tx) => (
              <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium">{tx.description}</div>
                  <div className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</div>
                </div>
                <div className={`font-bold ${tx.amount > 0 ? 'text-accent' : 'text-foreground'}`}>
                  {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-muted-foreground">No recent transactions</div>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}