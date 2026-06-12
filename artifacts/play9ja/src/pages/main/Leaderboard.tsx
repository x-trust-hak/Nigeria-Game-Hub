import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Star } from "lucide-react";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-2 text-primary">
          Global Leaderboard
        </h1>
        <p className="text-muted-foreground">Top players across Play9ja</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      ) : (
        <Card className="rounded-3xl border-none shadow-xl bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {leaderboard?.map((entry, index) => (
              <div key={entry.userId} className={`p-4 md:p-6 flex items-center gap-4 transition-colors ${index < 3 ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
                <div className="w-8 font-display font-bold text-xl text-center shrink-0">
                  {index === 0 ? <Trophy className="w-6 h-6 text-yellow-500 mx-auto" /> : 
                   index === 1 ? <Medal className="w-6 h-6 text-slate-400 mx-auto" /> : 
                   index === 2 ? <Medal className="w-6 h-6 text-amber-600 mx-auto" /> : 
                   <span className="text-muted-foreground">{entry.rank}</span>}
                </div>
                
                <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                  <AvatarImage src={entry.avatarUrl || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {entry.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate text-base">{entry.username}</h3>
                    {entry.isMember && <Star className="w-3 h-3 text-amber-500 fill-current shrink-0" />}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {entry.totalWins} Wins • {entry.country}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-accent">₦{entry.totalRewards.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Total Earned</div>
                </div>
              </div>
            ))}
            {!leaderboard?.length && (
              <div className="p-8 text-center text-muted-foreground">No leaderboard data available</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}