import { useGetWalletBalance, useListWalletTransactions, useCreateDeposit, useCreateWithdrawal } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownToLine, ArrowUpFromLine, History, Copy, Check, Upload, X, ChevronRight, Loader2, CheckCircle, Wallet as WalletIcon } from "lucide-react";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

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

const MIN_DEPOSIT = 1000;
const MIN_WITHDRAWAL = 1000;

type Modal = "none" | "deposit" | "withdraw" | "depositDone" | "withdrawDone";

export default function Wallet() {
  const { data: balance, refetch: refetchBalance } = useGetWalletBalance();
  const { data: txList, refetch: refetchTx } = useListWalletTransactions();
  const { data: settings } = useQuery({ queryKey: ["public-settings"], queryFn: fetchPublicSettings });
  const createDeposit = useCreateDeposit();
  const requestWithdrawal = useCreateWithdrawal();
  const { toast } = useToast();

  const [modal, setModal] = useState<Modal>("none");
  const [amount, setAmount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" }); return;
    }
    setProofFile(file);
    setProofPreview(await toBase64(file));
  };

  const openDeposit = () => {
    setModal("deposit");
    setAmount("");
    setProofFile(null);
    setProofPreview(null);
  };

  const openWithdraw = () => {
    setModal("withdraw");
    setAmount("");
    setBankName("");
    setAccountNumber("");
    setAccountName("");
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModal("none");
  };

  const handleDeposit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < MIN_DEPOSIT) {
      toast({ title: `Minimum deposit is ₦${MIN_DEPOSIT.toLocaleString()}`, variant: "destructive" }); return;
    }
    if (!proofFile) {
      toast({ title: "Please upload payment screenshot", variant: "destructive" }); return;
    }
    setIsSubmitting(true);
    try {
      const proofUrl = await toBase64(proofFile);
      await createDeposit.mutateAsync({ data: { amount: amt, proofUrl } } as any);
      setModal("depositDone");
      refetchBalance();
      refetchTx();
    } catch (err: any) {
      toast({ title: "Deposit failed", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    const withdrawable = balance?.withdrawable ?? 0;
    if (!amt || amt < MIN_WITHDRAWAL) {
      toast({ title: `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}`, variant: "destructive" }); return;
    }
    if (amt > withdrawable) {
      toast({ title: "Insufficient balance", description: `Available: ₦${withdrawable.toLocaleString()}`, variant: "destructive" }); return;
    }
    if (!bankName || !accountNumber || !accountName) {
      toast({ title: "Please fill in all bank details", variant: "destructive" }); return;
    }
    setIsSubmitting(true);
    try {
      await requestWithdrawal.mutateAsync({ data: { amount: amt, bankName, accountNumber, accountName } } as any);
      setModal("withdrawDone");
      refetchBalance();
      refetchTx();
    } catch (err: any) {
      toast({ title: "Withdrawal failed", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const txTypeIcon = (type: string, amount: number) => {
    const pos = amount > 0;
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pos ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
        {pos ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24 max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">My Wallet</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-3xl border-none shadow-xl bg-black text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent opacity-60" />
          <CardContent className="p-6 relative z-10 flex flex-col justify-between min-h-[200px]">
            <div className="flex items-center justify-between">
              <span className="text-white/80 font-medium text-sm">Withdrawable Balance</span>
              <WalletIcon className="w-5 h-5 text-primary/80" />
            </div>
            <div>
              <div className="text-4xl font-display font-bold mb-4">₦{(balance?.withdrawable ?? 0).toLocaleString()}</div>
              <Button
                onClick={openWithdraw}
                className="w-full bg-white text-black hover:bg-white/90 rounded-xl h-12 font-bold text-sm"
              >
                <ArrowUpFromLine className="w-4 h-4 mr-2" /> Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm bg-card relative overflow-hidden">
          <CardContent className="p-6 flex flex-col justify-between min-h-[200px]">
            <div>
              <span className="text-muted-foreground font-medium text-sm">Total Balance</span>
              <div className="text-2xl font-bold mt-1">₦{(balance?.total ?? 0).toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="text-xs text-muted-foreground">Game Earnings</div>
                <div className="font-bold text-primary">₦{(balance?.game ?? 0).toLocaleString()}</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="text-xs text-muted-foreground">Referral Bonus</div>
                <div className="font-bold text-purple-500">₦{(balance?.referral ?? 0).toLocaleString()}</div>
              </div>
            </div>
            <Button
              onClick={openDeposit}
              className="w-full rounded-xl h-12 font-bold text-sm gold-gradient text-black border-none"
            >
              <ArrowDownToLine className="w-4 h-4 mr-2" /> Deposit
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5" />
          <h2 className="text-xl font-display font-bold">Transaction History</h2>
        </div>
        <Card className="rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {txList?.transactions && txList.transactions.length > 0 ? txList.transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  {txTypeIcon(tx.type, tx.amount)}
                  <div>
                    <div className="font-semibold text-sm capitalize">{tx.type}</div>
                    <div className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()} · <span className={tx.status === "completed" ? "text-green-500" : "text-amber-500"}>{tx.status}</span></div>
                  </div>
                </div>
                <div className={`font-bold text-sm ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                  {tx.amount > 0 ? "+" : ""}₦{Math.abs(tx.amount).toLocaleString()}
                </div>
              </div>
            )) : (
              <div className="p-10 text-center">
                <div className="text-4xl mb-3">💳</div>
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Make a deposit to get started</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Deposit Modal */}
      <Dialog open={modal === "deposit" || modal === "depositDone"} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-sm rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          {modal === "depositDone" ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold font-display">Deposit Submitted!</h3>
              <p className="text-muted-foreground text-sm">We've received your deposit request of ₦{parseFloat(amount).toLocaleString()}. It'll be credited once confirmed, usually within 1–2 hours.</p>
              <Button className="w-full h-12 rounded-xl font-bold gold-gradient text-black border-none" onClick={closeModal}>Done</Button>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 pb-4 relative">
                <button onClick={closeModal} className="absolute top-4 right-4 text-muted-foreground"><X className="w-5 h-5" /></button>
                <h2 className="text-xl font-bold font-display">Deposit Funds</h2>
                <p className="text-sm text-muted-foreground mt-1">Min ₦{MIN_DEPOSIT.toLocaleString()} · Credited after review</p>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <Label className="text-sm font-semibold">Amount (₦)</Label>
                  <Input
                    type="number"
                    placeholder={`Min ₦${MIN_DEPOSIT.toLocaleString()}`}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="mt-1.5 h-12 rounded-xl text-lg font-bold"
                    min={MIN_DEPOSIT}
                  />
                  {amount && parseFloat(amount) < MIN_DEPOSIT && (
                    <p className="text-xs text-destructive mt-1">Minimum deposit is ₦{MIN_DEPOSIT.toLocaleString()}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold mb-3">Transfer to this account:</p>
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
                        <button onClick={() => handleCopy(item.value, item.key)} className="text-primary hover:text-primary/70 transition-colors p-1">
                          {copied === item.key ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Upload payment screenshot:</p>
                  {proofPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-border">
                      <img src={proofPreview} alt="Proof" className="w-full h-40 object-cover" />
                      <button onClick={() => { setProofFile(null); setProofPreview(null); }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-2xl p-5 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors">
                      <Upload className="w-7 h-7 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Tap to upload screenshot</p>
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                <Button
                  className="w-full h-12 rounded-xl gold-gradient text-black font-bold border-none"
                  onClick={handleDeposit}
                  disabled={!proofFile || !amount || parseFloat(amount) < MIN_DEPOSIT || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Submit Deposit <ChevronRight className="w-4 h-4 ml-1" /></>}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdrawal Modal */}
      <Dialog open={modal === "withdraw" || modal === "withdrawDone"} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-sm rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          {modal === "withdrawDone" ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold font-display">Withdrawal Submitted!</h3>
              <p className="text-muted-foreground text-sm">Your withdrawal of ₦{parseFloat(amount).toLocaleString()} is being processed. Funds will be sent to your bank account within 24 hours.</p>
              <Button className="w-full h-12 rounded-xl font-bold" onClick={closeModal}>Done</Button>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 p-6 pb-4 relative">
                <button onClick={closeModal} className="absolute top-4 right-4 text-muted-foreground"><X className="w-5 h-5" /></button>
                <h2 className="text-xl font-bold font-display">Withdraw Funds</h2>
                <p className="text-sm text-muted-foreground mt-1">Available: ₦{(balance?.withdrawable ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Amount (₦)</Label>
                  <Input type="number" placeholder={`Min ₦${MIN_WITHDRAWAL.toLocaleString()}`} value={amount} onChange={e => setAmount(e.target.value)} className="mt-1.5 h-12 rounded-xl text-lg font-bold" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Bank Name</Label>
                  <Input placeholder="e.g. GTBank, Access, Zenith..." value={bankName} onChange={e => setBankName(e.target.value)} className="mt-1.5 rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Account Number</Label>
                  <Input placeholder="10-digit account number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="mt-1.5 rounded-xl" maxLength={10} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Account Name</Label>
                  <Input placeholder="As it appears on your bank" value={accountName} onChange={e => setAccountName(e.target.value)} className="mt-1.5 rounded-xl" />
                </div>
                <Button
                  className="w-full h-12 rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90"
                  onClick={handleWithdraw}
                  disabled={!amount || parseFloat(amount) < MIN_WITHDRAWAL || !bankName || !accountNumber || !accountName || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Submit Withdrawal <ChevronRight className="w-4 h-4 ml-1" /></>}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
