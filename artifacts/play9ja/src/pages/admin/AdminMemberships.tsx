import { useState } from "react";
import { useListAdminMemberships, useUpdateMembershipStatus } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AdminMemberships() {
  const { data: memberships = [], isLoading, refetch } = useListAdminMemberships() as any;
  const updateMembership = useUpdateMembershipStatus();
  const { toast } = useToast();
  const [selected, setSelected] = useState<any>(null);
  const [action, setAction] = useState<"approved" | "declined" | null>(null);
  const [notes, setNotes] = useState("");

  const handleAction = async () => {
    if (!selected || !action) return;
    await updateMembership.mutateAsync({ id: selected.id, data: { status: action, notes } } as any);
    toast({ title: action === "approved" ? "Membership approved!" : "Membership declined" });
    setSelected(null);
    setAction(null);
    setNotes("");
    refetch();
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
    if (status === "declined") return <Badge variant="destructive">Declined</Badge>;
    return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{memberships.filter((m: any) => m.status === "pending").length} pending approval</p>

      <Card className="rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td></tr>
                ))
              ) : memberships.map((m: any) => (
                <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">User #{m.userId}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{m.planName}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">₦{(m.amount ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{statusBadge(m.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {m.proofUrl && (
                        <a href={m.proofUrl} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon" className="w-8 h-8"><ExternalLink className="w-4 h-4" /></Button>
                        </a>
                      )}
                      {m.status === "pending" && (
                        <>
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setSelected(m); setAction("approved"); }}>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setSelected(m); setAction("declined"); }}>
                            <XCircle className="w-4 h-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setAction(null); setNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "approved" ? "Approve Membership" : "Decline Membership"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {action === "approved"
                ? `Approve ${selected?.planName} membership for User #${selected?.userId}?`
                : `Decline ${selected?.planName} membership for User #${selected?.userId}?`}
            </p>
            <div>
              <Label className="text-sm">Notes (optional)</Label>
              <Textarea placeholder="Add a note..." value={notes} onChange={e => setNotes(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setAction(null); }}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={updateMembership.isPending}
              className={action === "declined" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {action === "approved" ? "Approve" : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
