import { useState, useEffect } from "react";
import { useGetAdminSettings, useUpdateAdminSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Banknote, Link as LinkIcon, Gift } from "lucide-react";

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const { toast } = useToast();

  const [form, setForm] = useState({
    welcomeBonus: "",
    referralReward: "",
    telegramUrl: "",
    supportEmail: "",
    depositAccountName: "",
    depositAccountNumber: "",
    depositBankName: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        welcomeBonus: (settings as any).welcomeBonus?.toString() ?? "",
        referralReward: (settings as any).referralReward?.toString() ?? "",
        telegramUrl: (settings as any).telegramUrl ?? "",
        supportEmail: (settings as any).supportEmail ?? "",
        depositAccountName: (settings as any).depositAccountName ?? "",
        depositAccountNumber: (settings as any).depositAccountNumber ?? "",
        depositBankName: (settings as any).depositBankName ?? "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings.mutateAsync({ data: form } as any);
    toast({ title: "Settings saved!" });
  };

  if (isLoading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const Section = ({ title, icon: Icon, children }: any) => (
    <Card className="rounded-2xl border border-border">
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Icon className="w-4 h-4 text-primary" />{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );

  const Field = ({ label, ...props }: any) => (
    <div>
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <Input {...props} className="mt-1.5" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <Section title="Rewards" icon={Gift}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Welcome Bonus (₦)" type="number" value={form.welcomeBonus} onChange={(e: any) => setForm({ ...form, welcomeBonus: e.target.value })} />
          <Field label="Referral Reward (₦)" type="number" value={form.referralReward} onChange={(e: any) => setForm({ ...form, referralReward: e.target.value })} />
        </div>
      </Section>

      <Section title="Deposit Account" icon={Banknote}>
        <Field label="Account Name" value={form.depositAccountName} onChange={(e: any) => setForm({ ...form, depositAccountName: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Account Number" value={form.depositAccountNumber} onChange={(e: any) => setForm({ ...form, depositAccountNumber: e.target.value })} />
          <Field label="Bank Name" value={form.depositBankName} onChange={(e: any) => setForm({ ...form, depositBankName: e.target.value })} />
        </div>
      </Section>

      <Section title="Support Links" icon={LinkIcon}>
        <Field label="Telegram URL" value={form.telegramUrl} onChange={(e: any) => setForm({ ...form, telegramUrl: e.target.value })} placeholder="https://t.me/..." />
        <Field label="Support Email" type="email" value={form.supportEmail} onChange={(e: any) => setForm({ ...form, supportEmail: e.target.value })} placeholder="support@yourapp.com" />
      </Section>

      <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-full sm:w-auto">
        <Save className="w-4 h-4 mr-2" />
        Save All Settings
      </Button>
    </div>
  );
}
