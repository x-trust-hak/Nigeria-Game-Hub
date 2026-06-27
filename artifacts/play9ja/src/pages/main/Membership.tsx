import { useListMembershipPlans, usePurchaseMembership, useGetMembershipStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, Star, Loader2, Copy, Upload, ChevronRight, X, CheckCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchPublicSettings() {
  const res = await fetch(`${BASE}/api/support/public-settings`);
  if (!res.ok) return null;
  return res.json();
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
  });

type Step = "select" | "pay" | "upload" | "done";

export default function Membership() {
  const { data: plans, isLoading: isPlansLoading } = useListMembershipPlans();
  const { data: status, refetch: refetchStatus } = useGetMembershipStatus();
  const { data: settings } = useQuery({ queryKey: ["public-settings"], queryFn: fetchPublicSettings });
  const purchaseMutation = usePurchaseMembership();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("select");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChoosePlan = (plan: any) => {
    setSelectedPlan(plan);
    setStep("pay");
    setProofFile(null);
    setProofPreview(null);
  };

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setProofFile(file);
    const preview = await toBase64(file);
    setProofPreview(preview);
    setStep("upload");
  };

  const handleSubmit = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      let proofUrl: string | undefined;
      if (proofFile) {
        proofUrl = await toBase64(proofFile);
      }
      await purchaseMutation.mutateAsync({ data: { planId: selectedPlan.id, proofUrl } } as any);
      setStep("done");
      refetchStatus();
    } catch (err: any) {
      toast({ title: "Submission failed", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setStep("select");
    setSelectedPlan(null);
    setProofFile(null);
    setProofPreview(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <Badge variant="secondary" className="mb-4 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
          <Star className="w-3 h-3 mr-1 fill-current" /> PREMIUM ACCESS
        </Badge>
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">
          Unlock the Full Play9ja Experience
        </h1>
        <p className="text-lg text-muted-foreground">
          Get exclusive games, higher limits, faster withdrawals, and premium support.
        </p>
      </div>

      {/* Active membership banner */}
      {status?.isActive && (
        <Card className="gold-gradient rounded-3xl border-none shadow-xl text-black">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="font-bold text-lg uppercase tracking-wider opacity-80 mb-1">Active Plan</div>
              <div className="text-3xl font-display font-bold">{status.planName}</div>
            </div>
            <div className="text-center md:text-right">
              <div className="font-bold text-sm uppercase tracking-wider opacity-80 mb-1">Time Remaining</div>
              <div className="text-2xl font-bold">{status.daysRemaining} Days {status.hoursRemaining} Hrs</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending banner */}
      {status?.isPending && (
        <Card className="bg-orange-500/10 border-orange-500/20 rounded-3xl">
          <CardContent className="p-6 text-center text-orange-600 font-bold">
            ⏳ Your membership upgrade is currently pending review. We'll notify you once approved.
          </CardContent>
        </Card>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {isPlansLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-80 bg-muted animate-pulse rounded-3xl" />)
        ) : plans?.map((plan) => (
          <Card
            key={plan.id}
            className={`rounded-3xl border ${plan.isPopular ? "border-primary shadow-xl md:scale-105 z-10 relative" : "border-border shadow-sm"} bg-card overflow-hidden flex flex-col transition-all hover:shadow-xl`}
          >
            {plan.isPopular && (
              <div className="bg-primary text-primary-foreground text-center py-1.5 text-xs font-bold uppercase tracking-widest">
                ⭐ Most Popular
              </div>
            )}
            <CardContent className="p-6 md:p-8 flex-1 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-muted-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold">₦{plan.price.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{plan.durationDays} days access</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {(plan.benefits ?? []).map((benefit: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full h-12 rounded-xl font-bold text-base ${plan.isPopular ? "gold-gradient text-black border-none" : ""}`}
                variant={plan.isPopular ? "default" : "outline"}
                onClick={() => handleChoosePlan(plan)}
                disabled={status?.isActive || status?.isPending}
              >
                {status?.isPending ? "Pending" : status?.isActive ? "Active" : "Choose Plan"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Modal */}
      <Dialog open={step !== "select"} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-sm rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          {/* Done state */}
          {step === "done" && (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold font-display">Request Submitted!</h3>
              <p className="text-muted-foreground text-sm">
                Your {selectedPlan?.name} membership request has been received. We'll activate it once payment is confirmed, usually within a few hours.
              </p>
              <Button className="w-full h-12 rounded-xl font-bold" onClick={closeModal}>
                Done
              </Button>
            </div>
          )}

          {/* Pay step */}
          {(step === "pay" || step === "upload") && selectedPlan && (
            <>
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-6 pb-4">
                <button onClick={closeModal} className="absolute top-4 right-4 text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-primary fill-current" />
                  <span className="text-sm text-muted-foreground font-medium">{selectedPlan.name} Plan</span>
                </div>
                <p className="text-4xl font-bold font-display text-primary">₦{selectedPlan.price.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedPlan.durationDays} days membership</p>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <p className="text-sm font-semibold mb-3">Transfer exactly ₦{selectedPlan.price.toLocaleString()} to:</p>
                  <div className="bg-muted/60 rounded-2xl p-4 space-y-3">
                    {[
                      { label: "Bank", value: settings?.depositBankName ?? "Moniepoint MFB", key: "bank" },
                      { label: "Account Number", value: settings?.depositAccountNumber ?? "7074435901", key: "acct" },
                      { label: "Account Name", value: settings?.depositAccountName ?? "Modal Praise Philip Jacob", key: "name" },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="font-bold text-sm">{item.value}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(item.value, item.key)}
                          className="text-primary hover:text-primary/70 transition-colors p-1"
                        >
                          {copied === item.key ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm font-semibold mb-3">Upload payment screenshot:</p>
                  {proofPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-border">
                      <img src={proofPreview} alt="Proof" className="w-full h-48 object-cover" />
                      <button
                        onClick={() => { setProofFile(null); setProofPreview(null); setStep("pay"); }}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground font-medium">Tap to upload screenshot</p>
                      <p className="text-xs text-muted-foreground/60">JPG, PNG up to 5MB</p>
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                <Button
                  className="w-full h-13 rounded-xl gold-gradient text-black font-bold text-base border-none"
                  onClick={handleSubmit}
                  disabled={!proofFile || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Submit Request <ChevronRight className="w-4 h-4 ml-1" /></>}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Upload your transfer receipt and we'll activate your membership within a few hours.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
