import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Crown, Check, X, Zap, TrendingUp, Unlock, Shield, Star } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  reason?: "daily_limit" | "premium_game" | "withdraw_gate" | "generic";
  gameName?: string;
}

const REASONS = {
  daily_limit: {
    icon: "🎯",
    title: "Daily Limit Reached",
    subtitle: "You've used all your free plays for today",
    highlight: "Upgrade to keep playing and earning!",
    highlightColor: "text-amber-400",
  },
  premium_game: {
    icon: "👑",
    title: "VIP Game",
    subtitle: "This game is exclusive to members",
    highlight: "Join to unlock all premium games!",
    highlightColor: "text-purple-400",
  },
  withdraw_gate: {
    icon: "🏦",
    title: "Membership Required",
    subtitle: "Only members can withdraw their winnings",
    highlight: "Upgrade once — withdraw anytime!",
    highlightColor: "text-green-400",
  },
  generic: {
    icon: "⭐",
    title: "Upgrade Your Account",
    subtitle: "Get more from Play9ja with a membership",
    highlight: "Play more. Win more. Earn more.",
    highlightColor: "text-amber-400",
  },
};

const BENEFITS = [
  { icon: <Zap className="w-4 h-4 text-amber-400" />, text: "Up to 20 game plays per day (free = 3)", highlight: true },
  { icon: <TrendingUp className="w-4 h-4 text-green-400" />, text: "1.5× win multiplier on every game", highlight: true },
  { icon: <Unlock className="w-4 h-4 text-blue-400" />, text: "Withdraw your earnings to your bank", highlight: true },
  { icon: <Crown className="w-4 h-4 text-purple-400" />, text: "Access to all VIP-exclusive games", highlight: false },
  { icon: <Shield className="w-4 h-4 text-cyan-400" />, text: "Priority customer support", highlight: false },
  { icon: <Star className="w-4 h-4 text-rose-400" />, text: "Referral reward bonus boosts", highlight: false },
];

const PLANS = [
  { name: "Weekly", price: "₦7,000", per: "/week", badge: null },
  { name: "Monthly", price: "₦20,000", per: "/month", badge: "POPULAR" },
  { name: "Yearly", price: "₦50,000", per: "/year", badge: "BEST VALUE" },
];

export default function UpgradeModal({ open, onClose, reason = "generic", gameName }: Props) {
  const cfg = REASONS[reason];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        <div className="relative bg-gradient-to-b from-[#0a0a1a] to-[#111128] rounded-3xl overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="relative z-10 p-6 pt-8">
            {/* Icon + Title */}
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">{cfg.icon}</div>
              <h2 className="text-2xl font-black text-white tracking-tight">{cfg.title}</h2>
              <p className="text-gray-400 text-sm mt-1">{cfg.subtitle}</p>
              {gameName && (
                <p className="text-xs text-gray-500 mt-0.5">"{gameName}"</p>
              )}
              <div className={`mt-2 text-sm font-bold ${cfg.highlightColor}`}>
                {cfg.highlight}
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white/5 rounded-2xl p-4 mb-4 space-y-2.5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">What you unlock:</p>
              {BENEFITS.map((b, i) => (
                <div key={i} className={`flex items-center gap-3 ${b.highlight ? "opacity-100" : "opacity-70"}`}>
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    {b.icon}
                  </div>
                  <span className={`text-sm ${b.highlight ? "text-white font-medium" : "text-gray-400"}`}>
                    {b.text}
                  </span>
                  {b.highlight && <Check className="w-3.5 h-3.5 text-green-400 ml-auto shrink-0" />}
                </div>
              ))}
            </div>

            {/* Plans preview */}
            <div className="flex gap-2 mb-5">
              {PLANS.map(p => (
                <div key={p.name} className={`flex-1 rounded-xl p-2 text-center border ${p.badge ? "border-amber-500/50 bg-amber-500/10" : "border-white/10 bg-white/5"}`}>
                  {p.badge && (
                    <div className="text-[9px] font-bold text-amber-400 mb-0.5 uppercase tracking-wider">{p.badge}</div>
                  )}
                  <div className="text-white font-bold text-xs">{p.name}</div>
                  <div className="text-amber-400 font-black text-sm">{p.price}</div>
                  <div className="text-gray-500 text-[10px]">{p.per}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link href="/membership">
              <Button
                onClick={onClose}
                className="w-full h-13 rounded-2xl text-base font-black gold-gradient text-black border-none shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] transition-all py-3.5"
              >
                👑 Upgrade Now — Start Winning More
              </Button>
            </Link>
            <button
              onClick={onClose}
              className="w-full mt-3 text-xs text-gray-500 hover:text-gray-400 transition-colors py-1"
            >
              Maybe later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
