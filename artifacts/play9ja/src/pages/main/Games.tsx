import { useListGames, usePlayGame } from "@workspace/api-client-react";
import { useGetWalletBalance } from "@workspace/api-client-react";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Flame, Star, Trophy, X, Zap, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import type { Game } from "@workspace/api-client-react/src/generated/api.schemas";

type PlayState = "idle" | "playing" | "won" | "lost";

const CATEGORY_ANIM: Record<string, { emoji: string; label: string }> = {
  wheel: { emoji: "🎡", label: "Spinning..." },
  slots: { emoji: "🎰", label: "Rolling reels..." },
  card: { emoji: "🃏", label: "Flipping card..." },
  dice: { emoji: "🎲", label: "Rolling dice..." },
  sport: { emoji: "⚡", label: "Taking shot..." },
  puzzle: { emoji: "🧩", label: "Solving..." },
  quiz: { emoji: "🧠", label: "Thinking..." },
  memory: { emoji: "🟩", label: "Matching..." },
  prediction: { emoji: "🎯", label: "Predicting..." },
  luck: { emoji: "🍀", label: "Opening..." },
  jackpot: { emoji: "🎊", label: "Drawing..." },
  crash: { emoji: "🚀", label: "Flying..." },
  action: { emoji: "🔥", label: "Going..." },
  classic: { emoji: "🐍", label: "Playing..." },
  default: { emoji: "⭐", label: "Playing..." },
};

function GameAnimation({ category }: { category: string }) {
  const anim = CATEGORY_ANIM[category] ?? CATEGORY_ANIM.default;
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      <div className="text-7xl animate-bounce">{anim.emoji}</div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      <p className="text-muted-foreground font-medium text-sm">{anim.label}</p>
    </div>
  );
}

function WinResult({ reward, game }: { reward: number; game: Game }) {
  const particles = Array.from({ length: 12 });
  return (
    <div className="relative flex flex-col items-center justify-center py-8 gap-4 overflow-hidden">
      {particles.map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full opacity-0"
          style={{
            backgroundColor: ["#FFD700", "#FFA500", "#FF6B35", "#7CFC00", "#00CED1", "#FF69B4"][i % 6],
            left: `${8 + i * 7}%`,
            top: `${Math.random() * 60}%`,
            animation: `confettiFall 1.2s ease-out ${i * 0.08}s forwards`,
          }}
        />
      ))}
      <div className="text-6xl animate-bounce">🏆</div>
      <div className="text-center">
        <p className="text-primary font-bold text-2xl font-display">You Won!</p>
        <p className="text-4xl font-bold text-green-500 font-display mt-1">+₦{reward.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground mt-2">Added to your game balance</p>
      </div>
      <div className="flex gap-2 mt-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        <Star className="w-5 h-5 text-amber-400" />
        <Trophy className="w-5 h-5 text-amber-500" />
      </div>
    </div>
  );
}

function LoseResult({ game }: { game: Game }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      <div className="text-6xl" style={{ animation: "shake 0.5s ease-in-out" }}>😔</div>
      <div className="text-center">
        <p className="font-bold text-xl">Better luck next time!</p>
        <p className="text-sm text-muted-foreground mt-1">Win up to ₦{game.maxReward?.toLocaleString()}</p>
      </div>
    </div>
  );
}

function LowBalanceAlert({ totalBalance, hasMembership }: { totalBalance: number; hasMembership: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl border border-border animate-in slide-in-from-bottom duration-300">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">💸</div>
          <h3 className="text-xl font-bold font-display">Top Up Required</h3>
          <p className="text-muted-foreground text-sm mt-2">
            {totalBalance === 0
              ? "Your balance is empty. Deposit or upgrade your membership to play games and start earning!"
              : "You need an active membership or wallet balance to play."}
          </p>
        </div>
        <div className="space-y-3">
          <Link href="/wallet">
            <Button className="w-full h-12 rounded-xl gold-gradient text-black font-bold text-base">
              💰 Deposit Now
            </Button>
          </Link>
          <Link href="/membership">
            <Button variant="outline" className="w-full h-12 rounded-xl font-bold text-base border-primary text-primary">
              ⭐ Get Membership
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Games() {
  const { data: games, isLoading } = useListGames();
  const { data: balance } = useGetWalletBalance();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const [result, setResult] = useState<{ won: boolean; reward: number; message: string } | null>(null);
  const [showLowBalance, setShowLowBalance] = useState(false);
  const [dailyLimitGames, setDailyLimitGames] = useState<Set<number>>(new Set());

  const playMutation = usePlayGame();
  const { toast } = useToast();

  const totalBalance = (balance?.total ?? 0);

  const handlePlayClick = (game: Game) => {
    if (game.isPremium && totalBalance === 0) {
      setShowLowBalance(true);
      return;
    }
    setSelectedGame(game);
    setPlayState("idle");
    setResult(null);
  };

  const executePlay = () => {
    if (!selectedGame) return;

    setPlayState("playing");

    playMutation.mutate({ id: selectedGame.id!, data: {} }, {
      onSuccess: (res) => {
        setTimeout(() => {
          setResult({ won: res.won, reward: res.reward, message: res.message });
          setPlayState(res.won ? "won" : "lost");
          if (res.won) {
            toast({
              title: `🎉 You won ₦${res.reward.toLocaleString()}!`,
              description: `Added to your game balance.`,
              className: "bg-green-500 text-white border-none",
            });
          }
        }, 2200);
      },
      onError: (err: any) => {
        setPlayState("idle");
        const msg = err?.message ?? "Failed to play";
        if (msg.includes("Daily limit")) {
          setDailyLimitGames(prev => new Set([...prev, selectedGame.id!]));
          toast({ title: "Daily limit reached", description: msg, variant: "destructive" });
          setSelectedGame(null);
        } else if (msg.includes("membership")) {
          setSelectedGame(null);
          setShowLowBalance(true);
        } else {
          toast({ title: "Error", description: msg, variant: "destructive" });
        }
      },
    });
  };

  const closeModal = () => {
    if (playState === "playing") return;
    setSelectedGame(null);
    setPlayState("idle");
    setResult(null);
  };

  const playAgain = () => {
    setPlayState("idle");
    setResult(null);
  };

  const diffColor: Record<string, string> = {
    easy: "bg-green-500/10 text-green-600",
    medium: "bg-amber-500/10 text-amber-600",
    hard: "bg-red-500/10 text-red-600",
  };

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>

      <div className="p-4 md:p-8 space-y-6 pb-24">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-1">Game Lobby</h1>
            <p className="text-muted-foreground text-sm">Play games, win real Naira 💰</p>
          </div>
          {balance && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Game Balance</p>
              <p className="font-bold text-primary">₦{(balance.game ?? 0).toLocaleString()}</p>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {games?.map((game) => {
              const atLimit = dailyLimitGames.has(game.id!);
              const today = (game as any).playsToday ?? 0;
              const limit = game.dailyLimit ?? 5;
              const playsLeft = Math.max(0, limit - today);

              return (
                <Card
                  key={game.id}
                  onClick={() => !atLimit && handlePlayClick(game)}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden relative group ${
                    atLimit
                      ? "opacity-50 cursor-not-allowed border-border"
                      : "cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:border-primary/50 border-border"
                  }`}
                >
                  {game.isPremium && (
                    <div className="absolute top-0 right-0 bg-primary/90 text-primary-foreground text-xs px-2 py-0.5 rounded-bl-xl flex items-center gap-1">
                      <Lock className="w-3 h-3" /> VIP
                    </div>
                  )}
                  {game.difficulty === "hard" && (
                    <div className="absolute top-0 left-0 bg-red-500/90 text-white text-xs px-2 py-0.5 rounded-br-xl flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Hot
                    </div>
                  )}
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div className="text-5xl mt-2 group-hover:scale-110 transition-transform duration-200">{game.emoji}</div>
                    <h3 className="font-bold text-sm leading-tight">{game.name}</h3>
                    <Badge variant="secondary" className={`text-xs ${diffColor[game.difficulty ?? "medium"]}`}>
                      {game.difficulty}
                    </Badge>
                    <div className="text-xs text-muted-foreground">Up to ₦{(game.maxReward ?? 0).toLocaleString()}</div>
                    {atLimit ? (
                      <Badge variant="outline" className="text-xs text-red-500 border-red-200">Limit reached</Badge>
                    ) : (
                      <div className="text-xs text-muted-foreground/60">{playsLeft} plays left</div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Game Play Modal */}
      <Dialog open={!!selectedGame} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-sm rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedGame && (
            <>
              {/* Header */}
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-6 pb-4">
                {playState !== "playing" && (
                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{selectedGame.emoji}</div>
                  <div>
                    <h2 className="font-bold text-xl font-display">{selectedGame.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedGame.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-2">
                {playState === "idle" && (
                  <>
                    <div className="bg-muted/50 rounded-2xl p-4 mb-5 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Potential Reward</p>
                      <p className="text-3xl font-bold text-primary font-display">
                        ₦{selectedGame.minReward?.toLocaleString()} – ₦{selectedGame.maxReward?.toLocaleString()}
                      </p>
                      {selectedGame.isPremium && (
                        <p className="text-xs text-amber-600 mt-1">
                          <Star className="w-3 h-3 inline mr-1" />VIP: up to {selectedGame.premiumMultiplier}× multiplier
                        </p>
                      )}
                    </div>
                    <Button
                      className="w-full h-14 rounded-xl text-xl font-bold gold-gradient text-black border-none shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                      onClick={executePlay}
                    >
                      <Zap className="w-5 h-5 mr-2" /> PLAY NOW
                    </Button>
                  </>
                )}

                {playState === "playing" && <GameAnimation category={selectedGame.category ?? "default"} />}

                {playState === "won" && result && (
                  <>
                    <WinResult reward={result.reward} game={selectedGame} />
                    <div className="flex gap-3 mt-4">
                      <Button variant="outline" className="flex-1 rounded-xl" onClick={closeModal}>Done</Button>
                      <Button className="flex-1 rounded-xl gold-gradient text-black font-bold" onClick={playAgain}>
                        <RefreshCw className="w-4 h-4 mr-1" /> Play Again
                      </Button>
                    </div>
                  </>
                )}

                {playState === "lost" && result && (
                  <>
                    <LoseResult game={selectedGame} />
                    <div className="flex gap-3 mt-4">
                      <Button variant="outline" className="flex-1 rounded-xl" onClick={closeModal}>Close</Button>
                      <Button className="flex-1 rounded-xl" onClick={playAgain}>
                        <RefreshCw className="w-4 h-4 mr-1" /> Try Again
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {showLowBalance && (
        <div onClick={() => setShowLowBalance(false)}>
          <LowBalanceAlert totalBalance={totalBalance} hasMembership={false} />
        </div>
      )}
    </>
  );
}
