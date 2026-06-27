import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, CheckCircle, Star, Trash2, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function authFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("play9ja_token");
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function AdminPlans() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [newBenefit, setNewBenefit] = useState("");

  const { data: plans = [], isLoading } = useQuery<any[]>({
    queryKey: ["admin-plans"],
    queryFn: () => authFetch("/api/admin/membership-plans"),
  });

  const updatePlan = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      authFetch(`/api/admin/membership-plans/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      toast({ title: "Plan updated!" });
      setEditing(null);
    },
    onError: () => toast({ title: "Failed to update plan", variant: "destructive" }),
  });

  const handleEdit = (plan: any) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      benefits: [...(plan.benefits ?? [])],
    });
    setNewBenefit("");
  };

  const addBenefit = () => {
    if (!newBenefit.trim()) return;
    setForm((f: any) => ({ ...f, benefits: [...f.benefits, newBenefit.trim()] }));
    setNewBenefit("");
  };

  const removeBenefit = (i: number) => {
    setForm((f: any) => ({ ...f, benefits: f.benefits.filter((_: any, idx: number) => idx !== i) }));
  };

  const handleSave = () => {
    updatePlan.mutate({
      id: editing.id,
      data: { ...form, price: Number(form.price), durationDays: Number(form.durationDays) },
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="rounded-2xl border border-border"><CardContent className="p-6"><div className="h-40 bg-muted animate-pulse rounded-xl" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{plans.length} membership plans · click a plan to edit it</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan: any) => (
          <Card key={plan.id} className={`rounded-2xl border ${plan.isPopular ? "border-primary shadow-lg shadow-primary/10" : "border-border"} relative overflow-hidden`}>
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                <Star className="w-3 h-3" /> Popular
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display flex items-center justify-between">
                {plan.name}
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handleEdit(plan)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </CardTitle>
              <p className="text-3xl font-bold text-primary">₦{Number(plan.price).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{plan.durationDays} days · {plan.isActive ? "Active" : "Inactive"}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {(plan.benefits ?? []).map((b: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Plan: {editing?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Plan Name</Label>
                <Input value={form.name ?? ""} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Price (₦)</Label>
                <Input type="number" value={form.price ?? ""} onChange={e => setForm({ ...form, price: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Duration (days)</Label>
              <Input type="number" value={form.durationDays ?? ""} onChange={e => setForm({ ...form, durationDays: e.target.value })} className="mt-1" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form.isPopular} onChange={e => setForm({ ...form, isPopular: e.target.checked })} className="w-4 h-4 accent-primary" />
                <span className="text-sm font-medium">Mark as Popular</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-primary" />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Benefits</Label>
              <div className="space-y-2 mb-3">
                {(form.benefits ?? []).map((b: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="flex-1 text-sm">{b}</span>
                    <button onClick={() => removeBenefit(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add benefit..."
                  value={newBenefit}
                  onChange={e => setNewBenefit(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addBenefit())}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={addBenefit} type="button">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updatePlan.isPending}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
