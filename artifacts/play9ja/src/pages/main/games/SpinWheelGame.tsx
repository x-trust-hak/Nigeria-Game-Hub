import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { useGameSounds } from "@/hooks/useGameSounds";

const SEGMENTS = [
  { label: "LOSE",  multiplier: 0,   color: "#1a0a2e", textColor: "#ff4466" },
  { label: "1.5×",  multiplier: 1.5, color: "#0f3460", textColor: "#4fc3f7" },
  { label: "LOSE",  multiplier: 0,   color: "#1a0a2e", textColor: "#ff4466" },
  { label: "2×",    multiplier: 2,   color: "#16213e", textColor: "#69f0ae" },
  { label: "LOSE",  multiplier: 0,   color: "#1a0a2e", textColor: "#ff4466" },
  { label: "3×",    multiplier: 3,   color: "#0f3460", textColor: "#ffd740" },
  { label: "5×",    multiplier: 5,   color: "#533483", textColor: "#FFD700" },
  { label: "LOSE",  multiplier: 0,   color: "#1a0a2e", textColor: "#ff4466" },
];

const N = SEGMENTS.length;
const ANGLE = 360 / N;

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polarToCartesian(cx, cy, r, startDeg);
  const e = polarToCartesian(cx, cy, r, endDeg);
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y} Z`;
}

function labelPos(cx: number, cy: number, r: number, segIdx: number) {
  const mid = segIdx * ANGLE + ANGLE / 2;
  return polarToCartesian(cx, cy, r * 0.62, mid);
}

type Sounds = ReturnType<typeof useGameSounds>;

interface Props {
  gameId: number;
  betAmount: number;
  onPlay: (bet: number) => Promise<{ won: boolean; reward: number; multiplier?: number; message: string }>;
  isPlaying: boolean;
  balance: number;
  sounds?: Sounds;
}

export default function SpinWheelGame({ gameId, betAmount, onPlay, isPlaying, balance, sounds }: Props) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ won: boolean; reward: number; message: string } | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const { toast } = useToast();
  const rotRef = useRef(0);

  const spin = async () => {
    if (spinning || isPlaying || balance < betAmount) return;
    setSpinning(true);
    setResult(null);

    try {
      const res = await onPlay(betAmount);

      // Find target segment
      let targetSegIdx: number;
      if (res.won) {
        const mult = res.reward / betAmount;
        const idx = SEGMENTS.findIndex(s => s.multiplier >= mult);
        targetSegIdx = idx >= 0 ? idx : SEGMENTS.findIndex(s => s.multiplier > 0);
      } else {
        // Pick a random LOSE segment
        const loseIdxs = SEGMENTS.map((s, i) => s.multiplier === 0 ? i : -1).filter(i => i >= 0);
        targetSegIdx = loseIdxs[Math.floor(Math.random() * loseIdxs.length)];
      }

      // Calculate destination rotation: pointer at top, segment center at pointer
      const segCenter = targetSegIdx * ANGLE + ANGLE / 2;
      // Amount to rotate to bring segCenter to 0° (top)
      const extraSpins = 5 * 360;
      const target = rotRef.current + extraSpins + (360 - (rotRef.current % 360) + (360 - segCenter)) % 360;
      rotRef.current = target;

      setTransitioning(true);
      setRotation(target);

      setTimeout(() => {
        setTransitioning(false);
        setSpinning(false);
        setResult(res);
        if (res.won) {
          toast({
            title: `🎉 You won ₦${res.reward.toLocaleString()}!`,
            className: "bg-green-600 text-white border-none",
          });
        }
      }, 4200);
    } catch (err: any) {
      setSpinning(false);
      toast({ title: "Error", description: err?.message, variant: "destructive" });
    }
  };

  const cx = 150, cy = 150, r = 135;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Wheel container */}
      <div className="relative" style={{ width: 300, height: 300 }}>
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20" style={{ marginTop: -2 }}>
          <svg width="30" height="36" viewBox="0 0 30 36">
            <polygon points="15,34 0,0 30,0" fill="#FFD700" stroke="#000" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Spinning wheel */}
        <svg
          width="300"
          height="300"
          viewBox="0 0 300 300"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: transitioning ? "transform 4.2s cubic-bezier(0.05, 0, 0.15, 1)" : "none",
            borderRadius: "50%",
            filter: spinning ? "drop-shadow(0 0 16px rgba(255,215,0,0.5))" : "drop-shadow(0 0 8px rgba(0,0,0,0.5))",
          }}
        >
          {/* Outer glow ring */}
          <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="#FFD700" strokeWidth="3" opacity="0.6" />

          {/* Segments */}
          {SEGMENTS.map((seg, i) => {
            const start = i * ANGLE;
            const end = (i + 1) * ANGLE;
            const pos = labelPos(cx, cy, r, i);
            const textAngle = i * ANGLE + ANGLE / 2;
            return (
              <g key={i}>
                <path d={segmentPath(cx, cy, r, start, end)} fill={seg.color} stroke="#111" strokeWidth="1.5" />
                <text
                  x={pos.x}
                  y={pos.y}
                  fill={seg.textColor}
                  fontSize={seg.label.length > 4 ? "11" : "14"}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textAngle}, ${pos.x}, ${pos.y})`}
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {seg.label}
                </text>
              </g>
            );
          })}

          {/* Center hub */}
          <circle cx={cx} cy={cy} r={22} fill="#0a0a1a" stroke="#FFD700" strokeWidth="2.5" />
          <text x={cx} y={cy} fill="#FFD700" fontSize="18" textAnchor="middle" dominantBaseline="middle">🎯</text>
        </svg>
      </div>

      {/* Result */}
      {result && !spinning && (
        <div className={`text-center px-6 py-3 rounded-2xl font-bold text-lg ${result.won ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {result.won ? `🏆 +₦${result.reward.toLocaleString()}` : "😔 Better luck next time!"}
        </div>
      )}

      {/* Spin button */}
      <Button
        onClick={spin}
        disabled={spinning || balance < betAmount}
        className="w-48 h-14 rounded-2xl text-xl font-black gold-gradient text-black border-none shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
      >
        {spinning ? <Loader2 className="w-6 h-6 animate-spin" /> : "🎡 SPIN!"}
      </Button>
    </div>
  );
}
