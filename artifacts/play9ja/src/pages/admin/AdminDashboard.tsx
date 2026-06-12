import { useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, CreditCard, ArrowDownCircle, ArrowUpCircle,
  Gamepad2, TrendingUp, Clock, DollarSign
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  color?: string;
  isLoading?: boolean;
}

function StatCard({ title, value, icon: Icon, sub, color = "bg-primary/10 text-primary", isLoading }: StatCardProps) {
  return (
    <Card className="rounded-2xl border border-border">
      <CardContent className="p-5">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <div className={`p-2 rounded-xl ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-display">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  const fmt = (n: number) => n?.toLocaleString() ?? "0";
  const money = (n: number) => `₦${(n ?? 0).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display">Overview</h2>
        <p className="text-sm text-muted-foreground">Platform statistics at a glance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={fmt(stats?.totalUsers ?? 0)} icon={Users} sub={`+${stats?.todayUsers ?? 0} today`} color="bg-blue-500/10 text-blue-500" isLoading={isLoading} />
        <StatCard title="Premium Users" value={fmt(stats?.premiumUsers ?? 0)} icon={CreditCard} color="bg-amber-500/10 text-amber-500" isLoading={isLoading} />
        <StatCard title="Games Today" value={fmt(stats?.gamesPlayedToday ?? 0)} icon={Gamepad2} color="bg-purple-500/10 text-purple-500" isLoading={isLoading} />
        <StatCard title="Total Revenue" value={money(stats?.totalRevenue ?? 0)} icon={DollarSign} sub={`${money(stats?.dailyIncome ?? 0)} today`} color="bg-green-500/10 text-green-500" isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Pending Memberships" value={stats?.pendingMemberships ?? 0} icon={Clock} color="bg-orange-500/10 text-orange-500" isLoading={isLoading} />
        <StatCard title="Pending Deposits" value={stats?.pendingDeposits ?? 0} icon={ArrowDownCircle} color="bg-cyan-500/10 text-cyan-500" isLoading={isLoading} />
        <StatCard title="Pending Withdrawals" value={stats?.pendingWithdrawals ?? 0} icon={ArrowUpCircle} color="bg-red-500/10 text-red-500" isLoading={isLoading} />
        <StatCard title="Total Referrals" value={fmt(stats?.totalReferrals ?? 0)} icon={TrendingUp} color="bg-emerald-500/10 text-emerald-500" isLoading={isLoading} />
      </div>

      <Card className="rounded-2xl border border-border">
        <CardHeader><CardTitle className="text-base font-semibold">Revenue Summary</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Today</p>
            <p className="text-lg font-bold text-green-500">{money(stats?.dailyIncome ?? 0)}</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">This Month</p>
            <p className="text-lg font-bold text-blue-500">{money(stats?.monthlyIncome ?? 0)}</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">All Time</p>
            <p className="text-lg font-bold text-primary">{money(stats?.totalRevenue ?? 0)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
