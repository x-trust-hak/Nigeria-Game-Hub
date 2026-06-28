import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const CATEGORY_CONFIG: Record<string, { emoji: string; label: string; action: string; anim: string }> = {
  sport:    { emoji: "⚽", label: "Take your shot!", action: "🥅 SHOOT!", anim: "⚽→🥅" },
  puzzle:   { emoji: "🧩", label: "Solve the puzzle", action: "🧩 SOLVE!", anim: "🧩" },
  quiz:     { emoji: "🧠", label: "Answer the question", action: "🧠 ANSWER!", anim: "🧠" },
  memory:   { emoji: "🃏", label: "Test your memory", action: "🃏 MATCH!", anim: "🃏" },
  action:   { emoji: "🔥", label: "Go for it!", action: "🔥 GO!", anim: "🔥" },
  classic:  { emoji: "🐍", label: "Play the classic", action: "🎮 PLAY!", anim: "🐍" },
  luck:     { emoji: "🍀", label: "Try your luck", action: "🍀 TRY!", anim: "🍀" },
  jackpot:  { emoji: "🎊", label: "Go for the jackpot!", action: "🎊 DRAW!", anim: "🎊" },
  default:  { emoji: "⭐", label: "Play now", action: "⭐ PLAY!", anim: "⭐" },
};

interface Props {
  category: string;
  gameName: string;
  emoji: string;
  betAmount: number;
  onPlay: (bet: number) => Promise<{ won: boolean; reward: number; message: string }>;
  balance: number;
  sounds?: any;
}

export default function GenericGame({ category, gameName, emoji, betAmount, onPlay, balance, sounds }: Props) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.default;
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [result, setResult] = useState<{ won: boolean; reward: number } | null>(null);
  const { toast } = useToast();

  const play = async () => {
    if (phase !== "idle" || balance < betAmount) return;
    setPhase("playing");

    const res = await onPlay(betAmount).catch(err => {
      toast({ title: "Error", description: err?.message, variant: "destructive" });
      setPhase("idle");
      return null;
    });
    if (!res) return;

    setTimeout(() => {
      setPhase("done");
      setResult(res);
      if (res.won) toast({ title: `🎉 +₦${res.reward.toLocaleString()}!`, className: "bg-green-600 text-white border-none" });
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Game visual */}
      <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-gray-900 to-black border-4 border-amber-500/40 flex items-center justify-center shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <div
          className="z-10 text-center"
          style={{
            fontSize: 80,
            animation: phase === "playing" ? "genPulse 0.4s ease-in-out infinite" : "none",
          }}
        >
          {emoji || cfg.emoji}
        </div>
        {phase === "playing" && (
          <div className="absolute bottom-4 flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes genPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>

      {phase === "idle" && (
        <p className="text-muted-foreground text-sm text-center">{cfg.label}</p>
      )}

      {phase === "playing" && (
        <p className="text-primary font-bold animate-pulse">{cfg.anim} Playing...</p>
      )}

      {result && phase === "done" && (
        <div className={`text-center px-6 py-3 rounded-2xl font-bold text-lg ${result.won ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {result.won ? `🏆 +₦${result.reward.toLocaleString()}` : "😔 Better luck next time!"}
        </div>
      )}

      {phase !== "done" ? (
        <Button
          onClick={play}
          disabled={phase === "playing" || balance < betAmount}
          className="w-48 h-14 rounded-2xl text-lg font-black gold-gradient text-black border-none shadow-xl hover:scale-105 transition-all disabled:opacity-50"
        >
          {phase === "playing" ? <Loader2 className="w-6 h-6 animate-spin" /> : cfg.action}
        </Button>
      ) : (
        <Button onClick={() => { setPhase("idle"); setResult(null); }} className="w-48 h-12 rounded-xl font-bold">
          🔄 Play Again
        </Button>
      )}
    </div>
  );
}
