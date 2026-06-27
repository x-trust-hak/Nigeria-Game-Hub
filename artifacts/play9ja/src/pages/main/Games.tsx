import { useListGames, useGetWalletBalance } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Lock, Flame, Star, Trophy, Wallet, ArrowRight, Zap } from "lucide-react";

const CATEGORY_BADGE: Record<string, { label: string; color: string }> = {
  wheel:  { label: "WHEEL",  color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  slots:  { label: "SLOTS",  color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  card:   { label: "CARDS",  color: "bg-blue-500/10  text-blue-400  border-blue-500/20"  },
  dice:   { label: "DICE",   color: "bg-green-500/10 text-green-400 border-green-500/20" },
  sport:  { label: "SPORT",  color: "bg-red-500/10   text-red-400   border-red-500/20"   },
  crash:  { label: "CRASH",  color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  quiz:   { label: "QUIZ",   color: "bg-cyan-500/10  text-cyan-400  border-cyan-500/20"  },
  luck:   { label: "LUCKY",  color: "bg-pink-500/10  text-pink-400  border-pink-500/20"  },
};

const FEATURED_GAME_TYPES = ["wheel", "slots", "dice", "card"];

export default function Games() {
  const { data: games, isLoading } = useListGames();
  const { data: balance } = useGetWalletBalance();
  const walletBalance = balance?.withdrawable ?? 0;

  // Split featured vs regular
  const featured = games?.filter(g => {
    const n = (g.name ?? "").toLowerCase();
    return n.includes("spin") || n.includes("slot") || n.includes("wheel") || n.includes("dice");
  }).slice(0, 3) ?? [];

  return (
    <div className="pb-28">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-primary/20 to-transparent px-4 pt-6 pb-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-end justify-between mb-2">
            <div>
              <h1 className="text-3xl font-display font-black tracking-tight">Game Lobby</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Bet real money · Win real Naira 💰</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <Wallet className="w-3 h-3" /> Balance
              </p>
              <p className={`font-bold text-lg ${walletBalance === 0 ? "text-red-400" : "text-primary"}`}>
                ₦{walletBalance.toLocaleString()}
              </p>
            </div>
          </div>

          {walletBalance === 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 flex items-center gap-3 mt-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-red-400 text-sm">No balance to play!</p>
                <p className="text-xs text-red-400/70">Deposit or subscribe to start winning.</p>
              </div>
              <Link href="/wallet">
                <Button size="sm" className="h-8 text-xs gold-gradient text-black border-none rounded-lg font-bold shrink-0">
                  Top Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 max-w-xl mx-auto space-y-6">
        {/* Featured games (big cards) */}
        {!isLoading && featured.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-base">Featured Games</h2>
            </div>
            <div className="space-y-3">
              {featured.map(game => (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <div className="bg-gradient-to-r from-gray-900 to-black border border-amber-500/20 rounded-3xl p-4 flex items-center gap-4 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer group">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-4xl shrink-0 group-hover:scale-110 transition-transform">
                      {game.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-base text-white">{game.name}</h3>
                        {game.isPremium && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-xs text-gray-400 truncate mb-2">{game.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-green-400">Min ₦100</span>
                        <span className="text-gray-600">·</span>
                        <span className="text-xs font-bold text-amber-400">Up to 10× win</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Button size="sm" className="h-9 px-4 rounded-xl gold-gradient text-black font-bold text-xs border-none">
                        PLAY <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All games grid */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-base">All Games</h2>
            <Badge variant="secondary" className="text-xs ml-auto">{games?.length ?? 0} games</Badge>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {games?.map(game => {
                const catBadge = CATEGORY_BADGE[game.category ?? ""] ?? { label: game.category?.toUpperCase() ?? "GAME", color: "bg-muted text-muted-foreground border-border" };
                const today = (game as any).playsToday ?? 0;
                const limit = game.dailyLimit ?? 5;
                const playsLeft = Math.max(0, limit - today);
                const atLimit = playsLeft === 0;

                return (
                  <Link key={game.id} href={atLimit ? "#" : `/games/${game.id}`}>
                    <div className={`bg-card border rounded-2xl overflow-hidden transition-all group ${
                      atLimit
                        ? "opacity-50 cursor-not-allowed border-border"
                        : "border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
                    }`}>
                      {/* Game image area */}
                      <div className="bg-gradient-to-br from-gray-900 to-black h-28 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                        {game.isPremium && (
                          <div className="absolute top-2 right-2 bg-amber-500/90 text-black text-xs px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 font-bold">
                            <Lock className="w-2.5 h-2.5" /> VIP
                          </div>
                        )}
                        {game.difficulty === "hard" && (
                          <div className="absolute top-2 left-2 bg-red-500/90 text-white text-xs px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 font-bold">
                            <Flame className="w-2.5 h-2.5" /> Hot
                          </div>
                        )}
                        <span className="text-5xl z-10 group-hover:scale-110 transition-transform">{game.emoji}</span>
                      </div>

                      {/* Game info */}
                      <div className="p-3">
                        <h3 className="font-bold text-sm truncate mb-1">{game.name}</h3>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Badge variant="outline" className={`text-xs py-0 px-1.5 ${catBadge.color}`}>
                            {catBadge.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-500 font-bold">Win up to 10×</span>
                          {atLimit ? (
                            <span className="text-xs text-red-400">Limit ✓</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">{playsLeft} left</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom promo */}
        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-4 text-center">
          <p className="font-bold text-sm">🏆 Get membership for up to <span className="text-primary">1.5× more winnings</span> on every game!</p>
          <Link href="/membership">
            <Button size="sm" className="mt-2 h-8 text-xs rounded-lg gold-gradient text-black border-none font-bold">
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
