import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Props {
  betAmount: number;
  onPlay: (bet: number, choice?: string) => Promise<{ won: boolean; reward: number; message: string }>;
  balance: number;
  maxNumber?: number;
}

export default function NumberGame({ betAmount, onPlay, balance, maxNumber = 10 }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<{ won: boolean; reward: number } | null>(null);
  const { toast } = useToast();

  const play = async () => {
    if (!picked || playing || balance < betAmount) return;
    setPlaying(true);
    setRevealed(null);
    setResult(null);

    const res = await onPlay(betAmount, String(picked)).catch(err => {
      toast({ title: "Error", description: err?.message, variant: "destructive" });
      setPlaying(false);
      return null;
    });
    if (!res) return;

    let winNum: number;
    if (res.won) {
      winNum = picked;
    } else {
      do { winNum = Math.floor(Math.random() * maxNumber) + 1; } while (winNum === picked);
    }

    setTimeout(() => {
      setRevealed(winNum);
      setPlaying(false);
      setResult(res);
      if (res.won) toast({ title: `🎯 +₦${res.reward.toLocaleString()}!`, className: "bg-green-600 text-white border-none" });
    }, 1200);
  };

  const reset = () => {
    setPicked(null);
    setRevealed(null);
    setResult(null);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-muted-foreground text-sm">Pick a number 1–{maxNumber}</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">Win {maxNumber / 2}× your bet on correct guess</p>
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: maxNumber }, (_, i) => i + 1).map(n => {
          const isWin = revealed === n;
          const isPicked = picked === n;
          const isLost = revealed && picked === n && !result?.won;
          return (
            <button
              key={n}
              onClick={() => !playing && !result && setPicked(n)}
              disabled={playing || !!result}
              className={`w-12 h-12 rounded-xl text-lg font-bold border-2 transition-all hover:scale-105
                ${isWin && result?.won ? "bg-green-500 border-green-400 text-white shadow-lg shadow-green-400/30" : ""}
                ${isLost ? "bg-red-500 border-red-400 text-white" : ""}
                ${isWin && !result?.won ? "bg-amber-500 border-amber-400 text-black" : ""}
                ${isPicked && !revealed ? "bg-primary text-primary-foreground border-primary shadow-lg scale-110" : ""}
                ${!isPicked && !isWin ? "bg-card border-border hover:border-primary/50" : ""}
              `}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Reveal animation */}
      {playing && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-5xl animate-bounce">🎯</div>
          <p className="text-sm text-muted-foreground">Picking a number...</p>
        </div>
      )}

      {revealed && !playing && (
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-1">The number was:</p>
          <div className="text-5xl font-black text-primary font-display">{revealed}</div>
        </div>
      )}

      {result && (
        <div className={`text-center px-6 py-3 rounded-2xl font-bold text-lg ${result.won ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {result.won ? `🎯 Correct! +₦${result.reward.toLocaleString()}` : `😔 Wrong! It was ${revealed}`}
        </div>
      )}

      {!result ? (
        <Button
          onClick={play}
          disabled={!picked || playing || balance < betAmount}
          className="w-48 h-14 rounded-2xl text-lg font-black gold-gradient text-black border-none shadow-xl hover:scale-105 transition-all disabled:opacity-50"
        >
          {playing ? <Loader2 className="w-6 h-6 animate-spin" /> : "🎯 Confirm Bet"}
        </Button>
      ) : (
        <Button onClick={reset} className="w-48 h-12 rounded-xl font-bold">
          Play Again
        </Button>
      )}
    </div>
  );
}
