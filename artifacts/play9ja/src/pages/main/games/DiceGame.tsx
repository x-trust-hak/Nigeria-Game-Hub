import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

type Choice = "high" | "low";

interface Props {
  betAmount: number;
  onPlay: (bet: number, choice?: string) => Promise<{ won: boolean; reward: number; message: string }>;
  isPlaying: boolean;
  balance: number;
  sounds?: any;
}

export default function DiceGame({ betAmount, onPlay, isPlaying, balance, sounds }: Props) {
  const [rolling, setRolling] = useState(false);
  const [currentFace, setCurrentFace] = useState("⚃");
  const [finalFace, setFinalFace] = useState<string | null>(null);
  const [result, setResult] = useState<{ won: boolean; reward: number } | null>(null);
  const [choice, setChoice] = useState<Choice>("high");
  const { toast } = useToast();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const roll = async () => {
    if (rolling || balance < betAmount) return;
    setRolling(true);
    setFinalFace(null);
    setResult(null);

    // Animate dice
    intervalRef.current = setInterval(() => {
      setCurrentFace(DICE_FACES[Math.floor(Math.random() * 6)]);
    }, 80);

    const res = await onPlay(betAmount, choice).catch(err => {
      toast({ title: "Error", description: err?.message, variant: "destructive" });
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRolling(false);
      return null;
    });
    if (!res) return;

    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Pick a die face consistent with the result
      let faceIdx: number;
      if (res.won) {
        faceIdx = choice === "high" ? 3 + Math.floor(Math.random() * 3) : Math.floor(Math.random() * 3);
      } else {
        faceIdx = choice === "high" ? Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 3);
      }
      setFinalFace(DICE_FACES[faceIdx]);
      setCurrentFace(DICE_FACES[faceIdx]);
      setRolling(false);
      setResult(res);
      if (res.won) toast({ title: `🎲 Correct! +₦${res.reward.toLocaleString()}!`, className: "bg-green-600 text-white border-none" });
    }, 1800);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Dice display */}
      <div
        className="w-40 h-40 flex items-center justify-center rounded-3xl border-4 border-amber-500/40 bg-gradient-to-br from-gray-900 to-black shadow-2xl"
        style={{
          animation: rolling ? "diceSpin 0.15s linear infinite" : "none",
          fontSize: 80,
        }}
      >
        {currentFace}
      </div>

      <style>{`
        @keyframes diceSpin {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(5deg) scale(1.05); }
          50% { transform: rotate(0deg) scale(1); }
          75% { transform: rotate(-5deg) scale(1.05); }
          100% { transform: rotate(0deg) scale(1); }
        }
      `}</style>

      {/* Choice selector */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground font-medium">Predict the dice roll:</p>
        <div className="flex gap-3">
          <button
            onClick={() => setChoice("low")}
            disabled={rolling}
            className={`px-6 py-3 rounded-2xl font-bold text-base border-2 transition-all ${choice === "low" ? "bg-blue-500 text-white border-blue-400 shadow-lg" : "bg-card border-border text-muted-foreground hover:border-blue-400"}`}
          >
            ⬇️ LOW (1-3)<br />
            <span className="text-xs font-normal opacity-70">Win 1.8×</span>
          </button>
          <button
            onClick={() => setChoice("high")}
            disabled={rolling}
            className={`px-6 py-3 rounded-2xl font-bold text-base border-2 transition-all ${choice === "high" ? "bg-green-500 text-white border-green-400 shadow-lg" : "bg-card border-border text-muted-foreground hover:border-green-400"}`}
          >
            ⬆️ HIGH (4-6)<br />
            <span className="text-xs font-normal opacity-70">Win 1.8×</span>
          </button>
        </div>
      </div>

      {result && (
        <div className={`text-center px-6 py-3 rounded-2xl font-bold text-lg ${result.won ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {result.won ? `🎉 Correct! +₦${result.reward.toLocaleString()}` : "😔 Wrong guess — try again!"}
        </div>
      )}

      <Button
        onClick={roll}
        disabled={rolling || balance < betAmount}
        className="w-48 h-14 rounded-2xl text-xl font-black gold-gradient text-black border-none shadow-xl hover:scale-105 transition-all disabled:opacity-50"
      >
        {rolling ? <Loader2 className="w-6 h-6 animate-spin" /> : "🎲 ROLL!"}
      </Button>
    </div>
  );
}
