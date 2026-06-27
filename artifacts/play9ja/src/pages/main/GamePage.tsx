import { useParams, useLocation } from "wouter";
import { useListGames, usePlayGame, useGetWalletBalance } from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wallet, History, Lock, Zap } from "lucide-react";
import { Link } from "wouter";
import SpinWheelGame from "./games/SpinWheelGame";
import SlotsGame from "./games/SlotsGame";
import DiceGame from "./games/DiceGame";
import CardGame from "./games/CardGame";
import NumberGame from "./games/NumberGame";
import CrashGame from "./games/CrashGame";
import GenericGame from "./games/GenericGame";

const BET_OPTIONS = [100, 200, 500, 1000, 2000, 5000];

function getGameType(name: string, category: string): string {
  const n = name.toLowerCase();
  if (n.includes("spin") || n.includes("wheel") || category === "wheel") return "wheel";
  if (n.includes("slot") || category === "slots") return "slots";
  if (n.includes("dice") || n.includes("roll")) return "dice";
  if (n.includes("card") || n.includes("flip")) return "card";
  if (n.includes("number") || n.includes("predict")) return "number";
  if (n.includes("crash") || n.includes("rocket")) return "crash";
  return "generic";
}

export default function GamePage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const gameId = Number(params.id);

  const { data: games } = useListGames();
  const { data: balance, refetch: refetchBalance } = useGetWalletBalance();
  const playMutation = usePlayGame();

  const [betAmount, setBetAmount] = useState(200);
  const [playHistory, setPlayHistory] = useState<Array<{ won: boolean; reward: number; bet: number; time: string }>>([]);

  const game = games?.find(g => g.id === gameId);
  const walletBalance = balance?.withdrawable ?? 0;
  const hasBalance = walletBalance >= betAmount;

  const gameType = game ? getGameType(game.name ?? "", game.category ?? "") : "generic";

  const handlePlay = async (bet: number, choice?: string) => {
    const res = await playMutation.mutateAsync({
      id: gameId,
      data: { bet, choice: choice ?? null },
    });
    // Add to local history
    setPlayHistory(prev => [{
      won: res.won,
      reward: res.reward,
      bet,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }, ...prev.slice(0, 9)]);
    await refetchBalance();
    return {
      won: res.won,
      reward: res.reward,
      multiplier: res.reward > 0 ? res.reward / bet : 0,
      message: res.message,
    };
  };

  if (!game) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Loading game...</p>
      </div>
    );
  }

  const isLowBalance = walletBalance < betAmount;

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 p-4 max-w-lg mx-auto">
          <button onClick={() => setLocation("/games")} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">{game.emoji}</span>
            <div>
              <h1 className="font-bold text-base leading-tight">{game.name}</h1>
              <p className="text-xs text-muted-foreground">{game.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className={`font-bold text-sm ${isLowBalance ? "text-red-500" : "text-primary"}`}>
              ₦{walletBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {/* Low balance alert */}
        {isLowBalance && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <p className="font-bold text-red-400 text-sm">Insufficient balance!</p>
              <p className="text-xs text-red-400/70">You need ₦{betAmount.toLocaleString()} to play. Deposit or lower your bet.</p>
            </div>
            <div className="flex flex-col gap-1">
              <Link href="/wallet">
                <Button size="sm" className="h-8 text-xs gold-gradient text-black border-none rounded-lg font-bold">
                  Deposit
                </Button>
              </Link>
              <Link href="/membership">
                <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg">
                  Membership
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Game stats bar */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-border rounded-xl p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Win Chance</p>
            <p className="font-bold text-sm text-green-500">35%</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Max Win</p>
            <p className="font-bold text-sm text-primary">10×</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Daily Limit</p>
            <p className="font-bold text-sm">{game.dailyLimit}×</p>
          </div>
        </div>

        {/* Bet selector */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-sm flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" /> Bet Amount
            </p>
            <p className="text-sm font-bold text-primary">₦{betAmount.toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BET_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setBetAmount(opt)}
                className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  betAmount === opt
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                    : "bg-muted/50 border-border hover:border-primary/50 text-foreground"
                } ${walletBalance < opt ? "opacity-40" : ""}`}
              >
                ₦{opt >= 1000 ? `${opt / 1000}k` : opt}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Potential win: ₦{(betAmount * 2).toLocaleString()} – ₦{(betAmount * 10).toLocaleString()}
          </p>
        </div>

        {/* Game component */}
        <div className="bg-gradient-to-b from-gray-950/80 to-black/60 rounded-3xl border border-border p-5">
          {gameType === "wheel" && (
            <SpinWheelGame
              gameId={gameId}
              betAmount={betAmount}
              onPlay={handlePlay}
              isPlaying={playMutation.isPending}
              balance={walletBalance}
            />
          )}
          {gameType === "slots" && (
            <SlotsGame
              betAmount={betAmount}
              onPlay={handlePlay}
              isPlaying={playMutation.isPending}
              balance={walletBalance}
            />
          )}
          {gameType === "dice" && (
            <DiceGame
              betAmount={betAmount}
              onPlay={handlePlay}
              isPlaying={playMutation.isPending}
              balance={walletBalance}
            />
          )}
          {gameType === "card" && (
            <CardGame
              betAmount={betAmount}
              onPlay={handlePlay}
              isPlaying={playMutation.isPending}
              balance={walletBalance}
            />
          )}
          {gameType === "number" && (
            <NumberGame
              betAmount={betAmount}
              onPlay={handlePlay}
              balance={walletBalance}
            />
          )}
          {gameType === "crash" && (
            <CrashGame
              betAmount={betAmount}
              onPlay={handlePlay}
              balance={walletBalance}
            />
          )}
          {gameType === "generic" && (
            <GenericGame
              category={game.category ?? "default"}
              gameName={game.name ?? ""}
              emoji={game.emoji ?? "⭐"}
              betAmount={betAmount}
              onPlay={handlePlay}
              balance={walletBalance}
            />
          )}
        </div>

        {/* Play history */}
        {playHistory.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <History className="w-4 h-4 text-muted-foreground" />
              <p className="font-semibold text-sm">This Session</p>
            </div>
            <div className="divide-y divide-border">
              {playHistory.map((h, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{h.won ? "✅" : "❌"}</span>
                    <div>
                      <p className="text-xs font-semibold">{h.won ? "WIN" : "LOSE"}</p>
                      <p className="text-xs text-muted-foreground">Bet ₦{h.bet.toLocaleString()} · {h.time}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${h.won ? "text-green-500" : "text-red-500"}`}>
                    {h.won ? `+₦${h.reward.toLocaleString()}` : `-₦${h.bet.toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
