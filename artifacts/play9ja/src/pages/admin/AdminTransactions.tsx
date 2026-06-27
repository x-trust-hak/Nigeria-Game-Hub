import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, Search, TrendingUp, TrendingDown, Activity } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface TxRow {
  id: number;
  userId: number;
  username: string;
  email: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

interface TxResponse {
  transactions: TxRow[];
  total: number;
  page: number;
  limit: number;
  summary: { totalCredit: number; totalDebit: number };
}

const TYPE_OPTIONS = ["all", "deposit", "withdrawal", "game", "referral", "reward", "membership", "bonus"];
const STATUS_OPTIONS = ["all", "completed", "pending", "failed", "declined"];

const TYPE_COLORS: Record<string, string> = {
  deposit: "bg-green-500/10 text-green-600 border-green-200",
  withdrawal: "bg-red-500/10 text-red-600 border-red-200",
  game: "bg-blue-500/10 text-blue-600 border-blue-200",
  referral: "bg-purple-500/10 text-purple-600 border-purple-200",
  reward: "bg-amber-500/10 text-amber-600 border-amber-200",
  membership: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  bonus: "bg-teal-500/10 text-teal-600 border-teal-200",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/10 text-green-600",
  pending: "bg-amber-500/10 text-amber-600",
  failed: "bg-red-500/10 text-red-600",
  declined: "bg-red-500/10 text-red-600",
};

export default function AdminTransactions() {
  const [data, setData] = useState<TxResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("play9ja_token");
      const params = new URLSearchParams({ page: String(page), limit: "50", type, status });
      if (search) params.set("search", search);
      const res = await window.fetch(`${BASE}/api/admin/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } finally {
      setIsLoading(false);
    }
  }, [page, type, status, search]);

  useEffect(() => {
    const id = setTimeout(fetch, search ? 400 : 0);
    return () => clearTimeout(id);
  }, [fetch]);

  const totalPages = data ? Math.ceil(data.total / 50) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Transaction Log</h1>
          <p className="text-sm text-muted-foreground">All platform transactions</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetch} className="rounded-xl gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl border border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Transactions</p>
                <p className="text-xl font-bold">{data.total.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Credits</p>
                <p className="text-xl font-bold text-green-600">₦{data.summary.totalCredit.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Debits</p>
                <p className="text-xl font-bold text-red-600">₦{data.summary.totalDebit.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="rounded-2xl border border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or description..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 rounded-xl"
              />
            </div>
            <Select value={type} onValueChange={v => { setType(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-40 rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map(t => (
                  <SelectItem key={t} value={t}>{t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-40 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : !data?.transactions.length ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left p-3 font-semibold text-muted-foreground">User</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Type</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground hidden md:table-cell">Description</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Amount</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${tx.amount > 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                          {tx.amount > 0 ? <ArrowDownToLine className="w-3.5 h-3.5" /> : <ArrowUpFromLine className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-semibold">{tx.username}</div>
                          <div className="text-xs text-muted-foreground">{tx.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-xs capitalize ${TYPE_COLORS[tx.type] ?? "bg-muted"}`}>
                        {tx.type}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-muted-foreground text-xs max-w-[200px] truncate block">{tx.description}</span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[tx.status] ?? "bg-muted"}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                        {tx.amount > 0 ? "+" : ""}₦{Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-right hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}<br />
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, data.total)} of {data.total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="rounded-lg">← Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="rounded-lg">Next →</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
