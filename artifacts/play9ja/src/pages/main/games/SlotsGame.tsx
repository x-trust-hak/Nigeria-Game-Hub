import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "⭐", "7️⃣", "💎", "🔔", "🍀", "💰"];

function getRandomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function generateReel(count = 20) {
  return Array.from({ length: count }, () => getRandomSymbol());
}

interface ReelProps {
  symbols: string[];
  spinning: boolean;
  finalIdx: number;
  delay: number;
  onStop?: () => void;
}

function Reel({ symbols, spinning, finalIdx, delay, onStop }: ReelProps) {
  const [offset, setOffset] = useState(0);
  const [stopped, setStopped] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ITEM_H = 72;

  useEffect(() => {
    if (spinning) {
      setStopped(false);
      let pos = 0;
      intervalRef.current = setInterval(() => {
        pos = (pos + 1) % symbols.length;
        setOffset(pos * ITEM_H);
      }, 60);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    } else if (!stopped) {
      const t = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setOffset(finalIdx * ITEM_H);
        setStopped(true);
        onStop?.();
      }, delay);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [spinning]);

  const extended = [...symbols, ...symbols, ...symbols];

  return (
    <div
      className="relative overflow-hidden rounded-xl border-2 border-amber-500/40 bg-black/60"
      style={{ width: 80, height: ITEM_H * 3 }}
    >
      {/* Highlight center row */}
      <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: ITEM_H, height: ITEM_H, background: "rgba(255,215,0,0.08)", borderTop: "2px solid rgba(255,215,0,0.3)", borderBottom: "2px solid rgba(255,215,0,0.3)" }} />
      <div
        style={{
          transform: `translateY(-${offset}px)`,
          transition: stopped ? "transform 0.4s cubic-bezier(0.1, 0, 0.2, 1)" : "none",
        }}
      >
        {extended.map((sym, i) => (
          <div key={i} className="flex items-center justify-center" style={{ height: ITEM_H, fontSize: 36 }}>
            {sym}
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  betAmount: number;
  onPlay: (bet: number) => Promise<{ won: boolean; reward: number; message: string }>;
  isPlaying: boolean;
  balance: number;
}

export default function SlotsGame({ betAmount, onPlay, isPlaying, balance }: Props) {
  const REEL_COUNT = 3;
  const [reels] = useState(() => Array.from({ length: REEL_COUNT }, () => generateReel()));
  const [spinning, setSpinning] = useState(false);
  const [finalIdxs, setFinalIdxs] = useState([0, 0, 0]);
  const [result, setResult] = useState<{ won: boolean; reward: number } | null>(null);
  const stoppedCount = useRef(0);
  const { toast } = useToast();

  const spin = async () => {
    if (spinning || balance < betAmount) return;
    setSpinning(true);
    setResult(null);
    stoppedCount.current = 0;

    const res = await onPlay(betAmount).catch(err => {
      toast({ title: "Error", description: err?.message, variant: "destructive" });
      setSpinning(false);
      return null;
    });
    if (!res) return;

    // Pick final symbols
    let finals: number[];
    if (res.won) {
      const sym = Math.floor(Math.random() * SYMBOLS.length);
      finals = [sym, sym, sym]; // 3 of a kind for win
    } else {
      do {
        finals = Array.from({ length: REEL_COUNT }, () => Math.floor(Math.random() * SYMBOLS.length));
      } while (finals[0] === finals[1] && finals[1] === finals[2]);
    }
    setFinalIdxs(finals.map(i => i % reels[0].length));
    // After all reels done:
    setTimeout(() => {
      setSpinning(false);
      setResult(res);
      if (res.won) toast({ title: `🎰 JACKPOT! +₦${res.reward.toLocaleString()}!`, className: "bg-green-600 text-white border-none" });
    }, 2400);
  };

  const DELAYS = [600, 1000, 1500];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Machine frame */}
      <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl p-6 border-2 border-amber-500/50 shadow-2xl relative">
        {/* Screen glow */}
        <div className="absolute inset-0 rounded-3xl bg-amber-500/5 pointer-events-none" />

        <div className="text-center mb-4">
          <p className="text-amber-400 font-bold text-xs uppercase tracking-widest">🎰 LUCKY SLOTS</p>
        </div>

        <div className="flex gap-3 justify-center">
          {reels.map((reel, i) => (
            <Reel
              key={i}
              symbols={reel}
              spinning={spinning}
              finalIdx={finalIdxs[i]}
              delay={DELAYS[i]}
            />
          ))}
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          Match 3 symbols to win!
        </div>
      </div>

      {result && (
        <div className={`text-center px-6 py-3 rounded-2xl font-bold text-lg ${result.won ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {result.won ? `🏆 JACKPOT! +₦${result.reward.toLocaleString()}` : "😔 Try again!"}
        </div>
      )}

      <Button
        onClick={spin}
        disabled={spinning || balance < betAmount}
        className="w-48 h-14 rounded-2xl text-xl font-black gold-gradient text-black border-none shadow-xl hover:scale-105 transition-all disabled:opacity-50"
      >
        {spinning ? <Loader2 className="w-6 h-6 animate-spin" /> : "🎰 SPIN!"}
      </Button>
    </div>
  );
}
