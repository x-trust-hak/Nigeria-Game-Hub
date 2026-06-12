import { useGetWalletBalance, useListWalletTransactions } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react";

export default function Wallet() {
  const { data: balance } = useGetWalletBalance();
  const { data: txList } = useListWalletTransactions({ query: { enabled: true } });

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24 max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-6">My Wallet</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-3xl border-none shadow-xl bg-black text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent opacity-50"></div>
          <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full min-h-[180px]">
            <span className="text-white/80 font-medium">Withdrawable Balance</span>
            <div>
              <div className="text-4xl font-display font-bold mb-4">
                ₦{balance?.withdrawable.toLocaleString() || '0'}
              </div>
              <Button className="w-full bg-white text-black hover:bg-white/90 rounded-xl h-12 font-bold text-base">
                <ArrowUpFromLine className="w-5 h-5 mr-2" /> Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm bg-card relative overflow-hidden">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[180px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-muted-foreground font-medium text-sm">Total Assets</span>
                <div className="text-2xl font-bold mt-1">₦{balance?.total.toLocaleString() || '0'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-muted-foreground">Game Balance</div>
                <div className="font-bold">₦{balance?.game.toLocaleString() || '0'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Referral</div>
                <div className="font-bold">₦{balance?.referral.toLocaleString() || '0'}</div>
              </div>
            </div>
            <Button variant="outline" className="w-full rounded-xl h-12 font-bold text-base border-primary text-primary hover:bg-primary/10">
              <ArrowDownToLine className="w-5 h-5 mr-2" /> Deposit
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5" />
          <h2 className="text-xl font-display font-bold">Transaction History</h2>
        </div>
        
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {txList?.transactions && txList.transactions.length > 0 ? txList.transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.amount > 0 ? 'bg-accent/10 text-accent' : 'bg-foreground/5 text-foreground'
                  }`}>
                    {tx.amount > 0 ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{tx.type.toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()} • {tx.status}</div>
                  </div>
                </div>
                <div className={`font-bold ${tx.amount > 0 ? 'text-accent' : 'text-foreground'}`}>
                  {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-muted-foreground">No transactions found</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}