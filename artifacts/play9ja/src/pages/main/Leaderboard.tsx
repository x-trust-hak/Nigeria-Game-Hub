import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Crown, TrendingUp, ArrowDownToLine, Gamepad2 } from "lucide-react";

const NIGERIAN_NAMES = [
  "Amara O.", "Chukwuemeka A.", "Ngozi E.", "Emeka C.", "Adaeze I.",
  "Tunde B.", "Fatima Y.", "Blessing N.", "Samuel K.", "Chisom U.",
  "Emmanuel D.", "Precious A.", "Taiwo F.", "Victor O.", "Chiamaka E.",
  "Bello M.", "Oluwaseun T.", "Funmilayo A.", "Kayode B.", "Yetunde S.",
  "Obinna K.", "Damilola A.", "Adeola F.", "Nkechi O.", "Jide T.",
  "Sade A.", "Moses E.", "Kemi B.", "Ibrahim Y.", "Sunday C.",
  "Rotimi O.", "Aisha M.", "Josephine A.", "Kunle T.", "Miriam E.",
  "David O.", "Uche N.", "Tolani A.", "Rhoda C.", "Okonkwo E.",
  "Adunola B.", "Babatunde F.", "Uchenna K.", "Chidi S.", "Gift M.",
  "Peter A.", "Elizabeth O.", "Amaka I.", "Obi N.", "Lola T.",
];

function seededRand(seed: number, min: number, max: number) {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return min + (seed % (max - min + 1));
}

function buildLeaderboard(type: "players" | "withdrawers" | "depositors", seed: number) {
  return NIGERIAN_NAMES.map((name, i) => {
    const s = seed + i * 37 + type.length;
    const isPremium = seededRand(s + 1, 0, 100) > 45;
    let amount: number;
    if (type === "withdrawers") {
      amount = seededRand(s + 2, 15000, 850000);
    } else if (type === "depositors") {
      amount = seededRand(s + 3, 25000, 1200000);
    } else {
      amount = seededRand(s + 4, 5000, 420000);
    }
    const wins = seededRand(s + 5, 3, 280);
    return { name, isPremium, amount, wins, rank: i + 1 };
  })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 20)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

const MEDAL_COLORS = ["text-yellow-400", "text-slate-300", "text-amber-600"];
const BG_TOP3 = ["bg-yellow-500/8", "bg-slate-400/8", "bg-amber-600/8"];

const TABS = [
  { key: "players", label: "Top Players", icon: Gamepad2, amountLabel: "Earned" },
  { key: "withdrawers", label: "Top Withdrawers", icon: ArrowDownToLine, amountLabel: "Withdrawn" },
  { key: "depositors", label: "Top Depositors", icon: TrendingUp, amountLabel: "Deposited" },
] as const;

export default function Leaderboard() {
  const [tab, setTab] = useState<"players" | "withdrawers" | "depositors">("players");
  const seed = useMemo(() => Math.floor(Date.now() / (30 * 60 * 1000)), []);
  const data = useMemo(() => buildLeaderboard(tab, seed), [tab, seed]);
  const currentTab = TABS.find(t => t.key === tab)!;

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-2">
          🏆 Leaderboard
        </h1>
        <p className="text-muted-foreground text-sm">Top earners across Play9ja. Updates every 30 mins.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-muted rounded-2xl p-1.5">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${tab === t.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(" ")[1]}</span>
          </button>
        ))}
      </div>

      {/* Podium — top 3 */}
      <div className="grid grid-cols-3 gap-3 items-end">
        {[top3[1], top3[0], top3[2]].map((entry, podiumIdx) => {
          const actualRank = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2;
          const heights = ["h-24", "h-32", "h-20"];
          const e = entry;
          if (!e) return <div key={podiumIdx} />;
          return (
            <div key={e.name} className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold border-4 ${actualRank === 1 ? "border-yellow-400 bg-yellow-400/20" : actualRank === 0 ? "border-slate-300 bg-slate-300/20" : "border-amber-600 bg-amber-600/20"}`}>
                  {e.name.charAt(0)}
                </div>
                {e.isPremium && (
                  <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400 absolute -top-1 -right-1" />
                )}
              </div>
              <div className={`w-full ${heights[podiumIdx]} rounded-t-2xl flex flex-col items-center justify-start pt-3 gap-1 ${actualRank === 1 ? "gold-gradient text-black" : actualRank === 0 ? "bg-slate-400/20 border border-slate-400/30" : "bg-amber-700/20 border border-amber-700/30"}`}>
                <div className={`text-lg font-bold ${MEDAL_COLORS[actualRank]}`}>
                  {actualRank === 1 ? <Trophy className="w-5 h-5" /> : <Medal className="w-5 h-5" />}
                </div>
                <div className="text-xs font-bold text-center px-1 leading-tight truncate w-full text-center">{e.name.split(" ")[0]}</div>
                <div className="text-xs font-bold">₦{(e.amount / 1000).toFixed(0)}k</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranks 4–20 */}
      <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
        <div className="divide-y divide-border">
          {rest.map((entry) => (
            <div
              key={entry.name}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="w-7 text-center font-display font-bold text-sm text-muted-foreground shrink-0">
                {entry.rank}
              </div>

              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center font-bold text-sm text-primary">
                  {entry.name.charAt(0)}
                </div>
                {entry.isPremium && (
                  <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400 absolute -top-0.5 -right-0.5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">{entry.name}</span>
                  {entry.isPremium && (
                    <span className="text-[10px] font-bold bg-yellow-500/15 text-yellow-500 px-1.5 py-0.5 rounded-full shrink-0">PRO</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{entry.wins} wins</div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-primary">₦{entry.amount.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{currentTab.amountLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
