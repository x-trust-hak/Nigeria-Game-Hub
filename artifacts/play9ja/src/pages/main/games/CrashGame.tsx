import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Props {
  betAmount: number;
  onPlay: (bet: number) => Promise<{ won: boolean; reward: number; message: string }>;
  balance: number;
  sounds?: any;
}

export default function CrashGame({ betAmount, onPlay, balance, sounds }: Props) {
  const [phase, setPhase] = useState<"idle" | "flying" | "cashed" | "crashed" | "done">("idle");
  const [multiplier, setMultiplier] = useState(1.00);
  const [result, setResult] = useState<{ won: boolean; reward: number } | null>(null);
  const [targetMult, setTargetMult] = useState(2.0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const clearIt = () => { if (intervalRef.current) clearInterval(intervalRef.current); };

  const startFlight = async () => {
    if (phase !== "idle" || balance < betAmount) return;
    setPhase("flying");
    setMultiplier(1.00);

    const res = await onPlay(betAmount).catch(err => {
      toast({ title: "Error", description: err?.message, variant: "destructive" });
      setPhase("idle");
      return null;
    });
    if (!res) return;

    // Crash point: if won, crash at ~2×, if lost crash at ~1.2×
    const crashAt = res.won ? 1.8 + Math.random() * 2 : 1.05 + Math.random() * 0.5;
    setTargetMult(crashAt);

    let curr = 1.00;
    intervalRef.current = setInterval(() => {
      curr += 0.02 + curr * 0.005;
      setMultiplier(parseFloat(curr.toFixed(2)));
      if (curr >= crashAt) {
        clearIt();
        if (res.won) {
          setPhase("cashed");
          setResult(res);
          toast({ title: `🚀 Cashed out at ${curr.toFixed(2)}×! +₦${res.reward.toLocaleString()}!`, className: "bg-green-600 text-white border-none" });
        } else {
          setPhase("crashed");
          setResult(res);
        }
      }
    }, 80);
  };

  const reset = () => {
    setPhase("idle");
    setMultiplier(1.00);
    setResult(null);
  };

  const multColor = phase === "crashed" ? "#ff4444" :
    multiplier > 3 ? "#FFD700" :
    multiplier > 2 ? "#69f0ae" : "#4fc3f7";

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Crash display */}
      <div className="relative w-full max-w-xs h-52 rounded-3xl bg-gradient-to-b from-gray-950 to-black border-2 border-amber-500/30 overflow-hidden flex items-center justify-center">
        {/* Stars background */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "30px 30px"
        }} />

        {phase === "idle" && (
          <div className="text-center z-10">
            <div className="text-6xl mb-2">🚀</div>
            <p className="text-muted-foreground text-sm">Ready for launch!</p>
          </div>
        )}

        {(phase === "flying" || phase === "cashed") && (
          <div className="text-center z-10">
            <div className="text-6xl mb-2" style={{ animation: phase === "flying" ? "rocketFly 0.5s ease-in-out infinite alternate" : "none" }}>🚀</div>
            <div className="text-5xl font-black font-display" style={{ color: multColor }}>
              {multiplier.toFixed(2)}×
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {phase === "flying" ? "Flying..." : `✅ Cashed at ${multiplier.toFixed(2)}×`}
            </p>
          </div>
        )}

        {phase === "crashed" && (
          <div className="text-center z-10">
            <div className="text-6xl mb-2">💥</div>
            <div className="text-4xl font-black text-red-400">CRASHED!</div>
            <div className="text-lg font-bold text-red-400/70">at {multiplier.toFixed(2)}×</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rocketFly {
          from { transform: translateY(0) rotate(-10deg); }
          to { transform: translateY(-8px) rotate(10deg); }
        }
      `}</style>

      {result && (
        <div className={`text-center px-6 py-3 rounded-2xl font-bold text-lg ${result.won ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {result.won ? `🚀 +₦${result.reward.toLocaleString()}` : `💥 Lost ₦${betAmount.toLocaleString()}`}
        </div>
      )}

      {phase === "idle" && (
        <Button
          onClick={startFlight}
          disabled={balance < betAmount}
          className="w-48 h-14 rounded-2xl text-xl font-black gold-gradient text-black border-none shadow-xl hover:scale-105 transition-all disabled:opacity-50"
        >
          🚀 LAUNCH!
        </Button>
      )}

      {(phase === "cashed" || phase === "crashed") && (
        <Button onClick={reset} className="w-48 h-12 rounded-xl font-bold">
          🔄 Play Again
        </Button>
      )}

      {phase === "flying" && (
        <div className="text-sm text-muted-foreground animate-pulse">Auto cash-out running...</div>
      )}
    </div>
  );
}
