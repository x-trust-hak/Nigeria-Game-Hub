import { useState } from "react";
import { useListAdminGames, useUpdateGame } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";

export default function AdminGames() {
  const { data: games = [], isLoading, refetch } = useListAdminGames() as any;
  const updateGame = useUpdateGame();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const handleToggle = async (game: any) => {
    await updateGame.mutateAsync({ id: game.id, data: { isEnabled: !game.isEnabled } } as any);
    toast({ title: game.isEnabled ? "Game disabled" : "Game enabled" });
    refetch();
  };

  const handleEdit = (game: any) => {
    setEditing(game);
    setForm({ minReward: game.minReward, maxReward: game.maxReward, dailyLimit: game.dailyLimit, premiumMultiplier: game.premiumMultiplier });
  };

  const handleSave = async () => {
    await updateGame.mutateAsync({ id: editing.id, data: form } as any);
    toast({ title: "Game updated!" });
    setEditing(null);
    refetch();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{games.length} games total · {games.filter((g: any) => g.isEnabled).length} active</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-2xl border border-border"><CardContent className="p-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
        )) : games.map((game: any) => (
          <Card key={game.id} className="rounded-2xl border border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{game.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm">{game.name}</p>
                    <p className="text-xs text-muted-foreground">₦{game.minReward.toLocaleString()} – ₦{game.maxReward.toLocaleString()} · {game.dailyLimit}x/day</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{game.difficulty}</Badge>
                      {game.isPremium && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">Premium</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handleEdit(game)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Switch checked={game.isEnabled} onCheckedChange={() => handleToggle(game)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit: {editing?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Min Reward (₦)</Label>
                <Input type="number" value={form.minReward} onChange={e => setForm({ ...form, minReward: Number(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Max Reward (₦)</Label>
                <Input type="number" value={form.maxReward} onChange={e => setForm({ ...form, maxReward: Number(e.target.value) })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Daily Limit</Label>
                <Input type="number" value={form.dailyLimit} onChange={e => setForm({ ...form, dailyLimit: Number(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Premium Multiplier</Label>
                <Input type="number" step="0.1" value={form.premiumMultiplier} onChange={e => setForm({ ...form, premiumMultiplier: Number(e.target.value) })} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateGame.isPending}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
