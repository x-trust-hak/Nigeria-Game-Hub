import { useGetDailyRewardStatus, useClaimDailyReward, getGetDailyRewardStatusQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Gift, Check, Lock, Star } from "lucide-react";

export default function Rewards() {
  const { data: rewardStatus, isLoading } = useGetDailyRewardStatus();
  const claimMutation = useClaimDailyReward();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleClaim = () => {
    claimMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast({
          title: "Reward Claimed!",
          description: `You received ₦${data.amount}`,
          className: "bg-primary text-primary-foreground border-none",
        });
        queryClient.invalidateQueries({ queryKey: getGetDailyRewardStatusQueryKey() });
      },
      onError: (err) => {
        toast({
          title: "Claim Failed",
          description: err.message,
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">Daily Rewards</h1>
        <p className="text-muted-foreground">Come back every day to claim your free Naira.</p>
      </div>

      <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-card">
        <div className="gold-gradient p-6 text-center text-black">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-6 h-6 fill-current" />
            <span className="font-bold text-lg uppercase tracking-wider">Current Streak</span>
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div className="text-5xl font-display font-bold">{rewardStatus?.currentStreak || 0} Days</div>
        </div>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-5 md:grid-cols-7 gap-2 md:gap-4">
            {rewardStatus?.rewards.map((reward) => (
              <div 
                key={reward.day} 
                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  reward.isClaimed 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : reward.day === (rewardStatus.currentStreak || 0) + 1
                    ? 'border-accent bg-accent text-accent-foreground shadow-lg scale-105 z-10'
                    : 'border-border bg-muted text-muted-foreground opacity-70'
                }`}
              >
                {reward.isBonus && (
                  <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full z-20">
                    BONUS
                  </div>
                )}
                <div className="text-xs font-bold mb-1 opacity-80">DAY {reward.day}</div>
                <div className="font-bold text-sm md:text-base">₦{reward.amount}</div>
                <div className="mt-1">
                  {reward.isClaimed ? (
                    <Check className="w-4 h-4" />
                  ) : reward.day === (rewardStatus.currentStreak || 0) + 1 ? (
                    <Gift className="w-4 h-4 animate-bounce" />
                  ) : (
                    <Lock className="w-4 h-4 opacity-50" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Button 
              size="lg" 
              className={`w-full md:w-auto min-w-[200px] h-14 text-lg font-bold rounded-xl ${rewardStatus?.canClaim ? 'gold-gradient text-black shadow-lg hover:shadow-xl' : ''}`}
              disabled={!rewardStatus?.canClaim || claimMutation.isPending}
              onClick={handleClaim}
            >
              {claimMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 
               rewardStatus?.canClaim ? 'CLAIM REWARD' : 'Come back tomorrow'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="text-xl font-display font-bold mb-4">More Ways to Earn</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Refer Friends", desc: "Get ₦7,500 per friend", icon: Gift },
            { title: "Complete Missions", desc: "Daily & weekly tasks", icon: Check },
            { title: "Play Games", desc: "Win real cash prizes", icon: Star },
          ].map((way, i) => (
            <Card key={i} className="rounded-2xl border-none shadow-sm bg-card hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <way.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold">{way.title}</div>
                  <div className="text-sm text-muted-foreground">{way.desc}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}