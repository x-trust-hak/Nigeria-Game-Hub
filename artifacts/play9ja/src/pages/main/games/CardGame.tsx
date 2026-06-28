import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const CARDS = [
  { id: 0, back: "🂠" },
  { id: 1, back: "🂠" },
  { id: 2, back: "🂠" },
  { id: 3, back: "🂠" },
  { id: 4, back: "🂠" },
];

const WIN_CARDS  = ["🃁", "🂱", "🃑", "🂡", "🎴"];
const LOSE_CARDS = ["🃏", "💀", "🃏", "💀", "🃏"];

interface Props {
  betAmount: number;
  onPlay: (bet: number, choice?: string) => Promise<{ won: boolean; reward: number; message: string }>;
  isPlaying: boolean;
  balance: number;
  sounds?: any;
}

export default function CardGame({ betAmount, onPlay, isPlaying, balance, sounds }: Props) {
  const [phase, setPhase] = useState<"pick" | "revealing" | "done">("pick");
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{ won: boolean; reward: number } | null>(null);
  const { toast } = useToast();

  const pick = async (cardIdx: number) => {
    if (phase !== "pick" || balance < betAmount) return;
    setSelectedCard(cardIdx);
    setPhase("revealing");

    const res = await onPlay(betAmount).catch(err => {
      toast({ title: "Error", description: err?.message, variant: "destructive" });
      setPhase("pick");
      setSelectedCard(null);
      return null;
    });
    if (!res) return;

    // Reveal selected card
    const winCard = WIN_CARDS[cardIdx];
    const loseCard = LOSE_CARDS[cardIdx];
    const chosenFace = res.won ? winCard : loseCard;

    setTimeout(() => {
      setRevealed({ [cardIdx]: chosenFace });

      // After 0.5s reveal other cards
      setTimeout(() => {
        const allRevealed: Record<number, string> = {};
        CARDS.forEach((_, i) => {
          if (i === cardIdx) {
            allRevealed[i] = chosenFace;
          } else {
            // One random other card also wins, rest lose
            allRevealed[i] = res.won ? LOSE_CARDS[i] : (i === (cardIdx + 1) % 5 ? WIN_CARDS[i] : LOSE_CARDS[i]);
          }
        });
        setRevealed(allRevealed);
        setPhase("done");
        setResult(res);
        if (res.won) toast({ title: `🃏 Lucky Pick! +₦${res.reward.toLocaleString()}!`, className: "bg-green-600 text-white border-none" });
      }, 600);
    }, 400);
  };

  const reset = () => {
    setPhase("pick");
    setSelectedCard(null);
    setRevealed({});
    setResult(null);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-muted-foreground text-sm font-medium">
          {phase === "pick" ? "🃏 Pick a card — one hides a ₦ reward!" : phase === "revealing" ? "Revealing..." : ""}
        </p>
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {CARDS.map(card => {
          const isSelected = selectedCard === card.id;
          const face = revealed[card.id];
          const isWinCard = face && (face === WIN_CARDS[card.id] || face === "🃁" || face === "🂱" || face === "🃑" || face === "🂡" || face === "🎴");

          return (
            <div
              key={card.id}
              onClick={() => phase === "pick" && pick(card.id)}
              className="relative cursor-pointer"
              style={{ perspective: 400 }}
            >
              <div
                className="transition-all duration-500 rounded-2xl"
                style={{
                  width: 52,
                  height: 78,
                  transformStyle: "preserve-3d",
                  transform: face ? "rotateY(180deg)" : "rotateY(0deg)",
                  transition: "transform 0.5s ease",
                }}
              >
                {/* Back */}
                <div
                  className={`absolute inset-0 rounded-2xl flex items-center justify-center text-3xl border-2 transition-all
                    ${isSelected && !face ? "border-amber-400 shadow-lg shadow-amber-400/30 scale-110" : "border-border"}
                    ${phase === "pick" ? "hover:border-amber-400 hover:scale-110 bg-gradient-to-br from-blue-900 to-indigo-900" : "bg-gradient-to-br from-blue-900 to-indigo-900"}
                  `}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  🂠
                </div>
                {/* Front */}
                <div
                  className={`absolute inset-0 rounded-2xl flex items-center justify-center text-4xl border-2
                    ${isWinCard ? "border-amber-400 bg-gradient-to-br from-amber-900 to-yellow-900" : "border-red-800 bg-gradient-to-br from-red-950 to-gray-900"}
                  `}
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  {face ?? "🂠"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {result && (
        <div className={`text-center px-6 py-3 rounded-2xl font-bold text-lg ${result.won ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {result.won ? `🏆 +₦${result.reward.toLocaleString()} — Lucky you!` : "😔 Wrong card — better luck!"}
        </div>
      )}

      {phase === "done" && (
        <Button
          onClick={reset}
          className="w-48 h-12 rounded-xl font-bold gold-gradient text-black border-none"
        >
          🃏 Play Again
        </Button>
      )}

      {phase === "pick" && (
        <div className={`text-xs text-center text-muted-foreground ${balance < betAmount ? "text-red-400 font-bold" : ""}`}>
          {balance < betAmount ? "⚠️ Insufficient balance" : `Tap any card to bet ₦${betAmount.toLocaleString()}`}
        </div>
      )}
    </div>
  );
}
