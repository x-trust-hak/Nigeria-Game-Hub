import { useState } from "react";
import { useListAdminDeposits, useUpdateDepositStatus } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AdminDeposits() {
  const { data: deposits = [], isLoading, refetch } = useListAdminDeposits() as any;
  const updateDeposit = useUpdateDepositStatus();
  const { toast } = useToast();
  const [selected, setSelected] = useState<any>(null);
  const [action, setAction] = useState<"approved" | "declined" | null>(null);
  const [notes, setNotes] = useState("");

  const handleAction = async () => {
    if (!selected || !action) return;
    await updateDeposit.mutateAsync({ id: selected.id, data: { status: action, notes } } as any);
    toast({ title: action === "approved" ? "Deposit approved & credited!" : "Deposit declined" });
    setSelected(null); setAction(null); setNotes("");
    refetch();
  };

  const pending = deposits.filter((d: any) => d.status === "pending").length;

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">Approved</Badge>;
    if (status === "declined") return <Badge variant="destructive" className="text-xs">Declined</Badge>;
    return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs">Pending</Badge>;
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{pending} deposits pending review</p>
      <Card className="rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded" /></td></tr>
              )) : deposits.map((d: any) => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">User #{d.userId}</td>
                  <td className="px-4 py-3 font-bold text-green-600">₦{(d.amount ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{statusBadge(d.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {d.proofUrl && <a href={d.proofUrl} target="_blank" rel="noreferrer"><Button variant="ghost" size="icon" className="w-8 h-8"><ExternalLink className="w-4 h-4" /></Button></a>}
                      {d.status === "pending" && (
                        <>
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setSelected(d); setAction("approved"); }}><CheckCircle className="w-4 h-4 text-green-500" /></Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setSelected(d); setAction("declined"); }}><XCircle className="w-4 h-4 text-red-500" /></Button>
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
          <DialogHeader><DialogTitle>{action === "approved" ? "Approve Deposit" : "Decline Deposit"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {action === "approved" ? `Approve ₦${selected?.amount?.toLocaleString()} and credit to user wallet?` : `Decline deposit of ₦${selected?.amount?.toLocaleString()}?`}
            </p>
            <div>
              <Label className="text-sm">Notes (optional)</Label>
              <Textarea placeholder="Add a note..." value={notes} onChange={e => setNotes(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setAction(null); }}>Cancel</Button>
            <Button onClick={handleAction} disabled={updateDeposit.isPending} className={action === "declined" ? "bg-destructive hover:bg-destructive/90" : ""}>
              {action === "approved" ? "Approve & Credit" : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
