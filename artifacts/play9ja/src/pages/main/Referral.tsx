import { useGetReferralInfo, useGetReferralHistory } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share2, Users, Trophy } from "lucide-react";

export default function Referral() {
  const { data: refInfo } = useGetReferralInfo();
  const { data: history } = useGetReferralHistory();
  const { toast } = useToast();

  const handleCopy = () => {
    if (refInfo?.referralCode) {
      navigator.clipboard.writeText(refInfo.referralCode);
      toast({ title: "Copied!", description: "Referral code copied to clipboard." });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24 max-w-4xl mx-auto">
      <div className="text-center bg-primary/10 rounded-3xl p-8 border border-primary/20">
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-primary mb-2">
          Earn ₦7,500 Per Friend
        </h1>
        <p className="text-lg text-muted-foreground mb-6 max-w-lg mx-auto">
          Share your code. When a friend signs up and makes their first deposit, you both get rewarded!
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <div className="bg-background rounded-xl h-14 px-6 flex items-center justify-center text-2xl font-mono font-bold tracking-widest border border-border w-full sm:w-auto">
            {refInfo?.referralCode || "------"}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={handleCopy} className="h-14 px-8 rounded-xl font-bold flex-1">
              <Copy className="w-5 h-5 mr-2" /> Copy
            </Button>
            <Button variant="outline" className="h-14 px-4 rounded-xl flex-1">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-card md:col-span-2">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display font-bold">Your Referrals</h2>
              <div className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Users className="w-4 h-4" /> {refInfo?.totalReferrals || 0} Friends
              </div>
            </div>
            
            <div className="space-y-4">
              {history?.map((entry) => (
                <div key={entry.id} className="flex justify-between items-center p-4 bg-muted/50 rounded-xl">
                  <div>
                    <div className="font-bold">{entry.referredUsername}</div>
                    <div className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-accent">+₦{entry.reward.toLocaleString()}</div>
                    <div className="text-xs font-medium uppercase text-muted-foreground">{entry.status}</div>
                  </div>
                </div>
              ))}
              {!history?.length && (
                <div className="text-center py-8 text-muted-foreground">
                  You haven't referred anyone yet. Share your code to start earning!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-card">
          <CardContent className="p-6">
            <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" /> Total Earnings
            </h2>
            <div className="text-4xl font-display font-bold text-accent mb-2">
              ₦{refInfo?.totalEarnings.toLocaleString() || '0'}
            </div>
            <p className="text-sm text-muted-foreground mb-6">from your referrals</p>
            
            <div className="space-y-3">
              <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Milestones</div>
              {refInfo?.milestones?.map((m, i) => (
                <div key={i} className="relative">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{m.target} Friends</span>
                    <span className="font-bold">₦{m.reward.toLocaleString()} Bonus</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${m.achieved ? 'bg-accent' : 'bg-primary/50'}`} 
                      style={{ width: `${Math.min(100, ((refInfo.totalReferrals || 0) / m.target) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}