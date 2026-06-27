import { useState } from "react";
import { useListAdminUsers, useUpdateAdminUser, useDeleteAdminUser } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, UserX, UserCheck, Shield, ChevronLeft, ChevronRight, Pencil, Trash2, Plus, Minus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [balanceMode, setBalanceMode] = useState<"set" | "add" | "subtract">("set");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceField, setBalanceField] = useState("walletBalance");
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListAdminUsers({ page, limit: 20, search: search || undefined } as any);
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();

  const users = (data as any)?.users ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const handleOpenEdit = (user: any) => {
    setEditUser(user);
    setEditForm({
      username: user.username,
      role: user.role,
      isSuspended: user.isSuspended,
    });
    setBalanceAmount("");
    setBalanceMode("set");
    setBalanceField("walletBalance");
  };

  const handleSaveProfile = async () => {
    await updateUser.mutateAsync({ id: editUser.id, data: editForm } as any);
    toast({ title: "User updated!" });
    refetch();
    setEditUser(null);
  };

  const handleAdjustBalance = async () => {
    if (!balanceAmount) return;
    const current = parseFloat(editUser[balanceField] ?? 0);
    const amount = parseFloat(balanceAmount);
    let newValue: number;
    if (balanceMode === "set") newValue = amount;
    else if (balanceMode === "add") newValue = current + amount;
    else newValue = Math.max(0, current - amount);

    await updateUser.mutateAsync({ id: editUser.id, data: { [balanceField]: newValue } } as any);
    toast({ title: `Balance updated to ₦${newValue.toLocaleString()}` });
    refetch();
    setEditUser(null);
  };

  const handleDelete = async () => {
    await deleteUser.mutateAsync({ id: deleteTarget.id } as any);
    toast({ title: "User deleted" });
    refetch();
    setDeleteTarget(null);
  };

  const balanceLabels: Record<string, string> = {
    walletBalance: "Wallet Balance",
    referralBalance: "Referral Balance",
    gameBalance: "Game Balance",
  };

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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Balances</th>
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
                      <p className="text-xs text-muted-foreground/60">ID #{user.id} · Ref: {user.referralCode}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-green-600">₦{(user.walletBalance ?? 0).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">wallet</span></p>
                      <p className="text-xs text-muted-foreground">₦{(user.referralBalance ?? 0).toLocaleString()} ref · ₦{(user.gameBalance ?? 0).toLocaleString()} game</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {user.membershipStatus === "active"
                      ? <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                      : user.membershipStatus === "pending"
                        ? <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>
                        : <Badge variant="secondary">None</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {user.isSuspended
                        ? <Badge variant="destructive" className="text-xs">Suspended</Badge>
                        : <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">Active</Badge>}
                      {user.role === "admin" && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Admin</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handleOpenEdit(user)} title="Edit User">
                        <Pencil className="w-3.5 h-3.5 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setDeleteTarget(user)} title="Delete User">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
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

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User: {editUser?.username}</DialogTitle>
            <p className="text-xs text-muted-foreground">{editUser?.email}</p>
          </DialogHeader>

          <Tabs defaultValue="profile">
            <TabsList className="w-full">
              <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
              <TabsTrigger value="balance" className="flex-1">Balance</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-4">
              <div>
                <Label className="text-sm">Username</Label>
                <Input value={editForm.username ?? ""} onChange={e => setEditForm({ ...editForm, username: e.target.value })} className="mt-1" />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.role === "admin"}
                    onChange={e => setEditForm({ ...editForm, role: e.target.checked ? "admin" : "user" })}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" /> Admin Role
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editForm.isSuspended}
                    onChange={e => setEditForm({ ...editForm, isSuspended: e.target.checked })}
                    className="w-4 h-4 accent-destructive"
                  />
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <UserX className="w-3.5 h-3.5 text-destructive" /> Suspended
                  </span>
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={updateUser.isPending}>Save Profile</Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="balance" className="space-y-4 mt-4">
              <div className="bg-muted/50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Wallet:</span> <strong className="text-green-600">₦{(editUser?.walletBalance ?? 0).toLocaleString()}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Referral:</span> <strong>₦{(editUser?.referralBalance ?? 0).toLocaleString()}</strong></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Game:</span> <strong>₦{(editUser?.gameBalance ?? 0).toLocaleString()}</strong></div>
              </div>

              <div>
                <Label className="text-sm">Balance Type</Label>
                <select
                  value={balanceField}
                  onChange={e => setBalanceField(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="walletBalance">Wallet Balance</option>
                  <option value="referralBalance">Referral Balance</option>
                  <option value="gameBalance">Game Balance</option>
                </select>
              </div>

              <div>
                <Label className="text-sm">Operation</Label>
                <div className="mt-1 flex gap-2">
                  {(["set", "add", "subtract"] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setBalanceMode(m)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                        balanceMode === m
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {m === "add" ? <Plus className="w-3 h-3 inline mr-1" /> : m === "subtract" ? <Minus className="w-3 h-3 inline mr-1" /> : null}
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Amount (₦)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(e.target.value)}
                  className="mt-1"
                />
                {balanceAmount && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {balanceMode === "set" && `Set ${balanceLabels[balanceField]} to ₦${Number(balanceAmount).toLocaleString()}`}
                    {balanceMode === "add" && `Add ₦${Number(balanceAmount).toLocaleString()} → ₦${(parseFloat(editUser?.[balanceField] ?? 0) + parseFloat(balanceAmount)).toLocaleString()}`}
                    {balanceMode === "subtract" && `Subtract ₦${Number(balanceAmount).toLocaleString()} → ₦${Math.max(0, parseFloat(editUser?.[balanceField] ?? 0) - parseFloat(balanceAmount)).toLocaleString()}`}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button onClick={handleAdjustBalance} disabled={updateUser.isPending || !balanceAmount}>
                  Apply Balance
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleteTarget?.username}</strong>? This cannot be undone and will remove all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
