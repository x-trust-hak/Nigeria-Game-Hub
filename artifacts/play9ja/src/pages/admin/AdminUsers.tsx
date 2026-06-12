import { useState } from "react";
import { useListAdminUsers, useUpdateAdminUser, useDeleteAdminUser } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Search, UserX, UserCheck, Shield, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListAdminUsers({ page, limit: 20, search: search || undefined } as any);
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();

  const handleToggleSuspend = async (user: any) => {
    await updateUser.mutateAsync({ id: user.id, data: { isSuspended: !user.isSuspended } } as any);
    toast({ title: user.isSuspended ? "User unsuspended" : "User suspended" });
    refetch();
  };

  const handleRoleToggle = async (user: any) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    await updateUser.mutateAsync({ id: user.id, data: { role: newRole } } as any);
    toast({ title: `User role changed to ${newRole}` });
    refetch();
  };

  const users = (data as any)?.users ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <p className="text-sm text-muted-foreground">{total} total users</p>
      </div>

      <Card className="rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Balance</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Membership</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td></tr>
                ))
              ) : users.map((user: any) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="font-medium">₦{(user.walletBalance ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Wallet</p>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {user.membershipStatus === "active"
                      ? <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                      : user.membershipStatus === "pending"
                        ? <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>
                        : <Badge variant="secondary">None</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.isSuspended
                        ? <Badge variant="destructive" className="text-xs">Suspended</Badge>
                        : <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">Active</Badge>}
                      {user.role === "admin" && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Admin</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handleToggleSuspend(user)} title={user.isSuspended ? "Unsuspend" : "Suspend"}>
                        {user.isSuspended ? <UserCheck className="w-4 h-4 text-green-500" /> : <UserX className="w-4 h-4 text-red-500" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handleRoleToggle(user)} title="Toggle Admin">
                        <Shield className={`w-4 h-4 ${user.role === "admin" ? "text-primary" : "text-muted-foreground"}`} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 p-4 border-t border-border">
            <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        )}
      </Card>
    </div>
  );
}
