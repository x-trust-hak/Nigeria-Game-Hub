import { useState } from "react";
import { useListActivityMessages, useCreateActivityMessage, useUpdateActivityMessage, useDeleteActivityMessage, useBroadcastMessage } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Send, Megaphone } from "lucide-react";

export default function AdminNotifications() {
  const { data: messages = [], isLoading, refetch } = useListActivityMessages() as any;
  const createMsg = useCreateActivityMessage();
  const updateMsg = useUpdateActivityMessage();
  const deleteMsg = useDeleteActivityMessage();
  const sendBroadcast = useBroadcastMessage();
  const { toast } = useToast();

  const [newMsg, setNewMsg] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");

  const handleCreateMsg = async () => {
    if (!newMsg.trim()) return;
    await createMsg.mutateAsync({ data: { message: newMsg, isActive: true } } as any);
    setNewMsg("");
    toast({ title: "Activity message created!" });
    refetch();
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;
    await sendBroadcast.mutateAsync({ data: { title: broadcastTitle, message: broadcastMsg } } as any);
    setBroadcastTitle("");
    setBroadcastMsg("");
    toast({ title: "Broadcast sent to all users!" });
  };

  return (
    <div className="space-y-6">
      {/* Broadcast */}
      <Card className="rounded-2xl border border-border">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary" /> Send Broadcast</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm">Title</Label>
            <Input placeholder="Notification title..." value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm">Message</Label>
            <Textarea placeholder="Write your message to all users..." value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} className="mt-1" rows={3} />
          </div>
          <Button onClick={handleBroadcast} disabled={sendBroadcast.isPending || !broadcastTitle.trim() || !broadcastMsg.trim()}>
            <Send className="w-4 h-4 mr-2" />
            Send to All Users
          </Button>
        </CardContent>
      </Card>

      {/* Activity Messages */}
      <Card className="rounded-2xl border border-border">
        <CardHeader><CardTitle className="text-base">Live Activity Feed Messages</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="E.g. 🟢 David from Lagos just won ₦5,000!"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreateMsg()}
            />
            <Button onClick={handleCreateMsg} disabled={!newMsg.trim() || createMsg.isPending}>Add</Button>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-xl" />)
            ) : messages.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                <Switch
                  checked={m.isActive}
                  onCheckedChange={async (checked) => {
                    await updateMsg.mutateAsync({ id: m.id, data: { isActive: checked } } as any);
                    refetch();
                  }}
                />
                <p className="text-sm flex-1">{m.message}</p>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive"
                  onClick={async () => { await deleteMsg.mutateAsync({ id: m.id } as any); refetch(); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
