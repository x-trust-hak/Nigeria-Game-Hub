import { useEffect, useState, useRef } from "react";

const EVENTS = [
  { msg: "Amara just joined Play9ja", icon: "🎉", color: "text-green-400" },
  { msg: "Chukwuemeka just created an account", icon: "🎊", color: "text-green-400" },
  { msg: "Ngozi just joined and got ₦15,000 bonus", icon: "🎁", color: "text-green-400" },
  { msg: "Tunde just signed up via referral", icon: "🤝", color: "text-green-400" },
  { msg: "Adaeze just created her account", icon: "👋", color: "text-green-400" },
  { msg: "Emeka just joined the platform", icon: "🎉", color: "text-green-400" },
  { msg: "Fatima just registered and got welcome bonus", icon: "🎁", color: "text-green-400" },

  { msg: "Peter just withdrew ₦30,000", icon: "💸", color: "text-amber-400" },
  { msg: "Elizabeth just withdrew ₦100,000", icon: "💸", color: "text-amber-400" },
  { msg: "Chisom just withdrew ₦55,000", icon: "💸", color: "text-amber-400" },
  { msg: "Bello just withdrew ₦22,500", icon: "💰", color: "text-amber-400" },
  { msg: "Oluwaseun just withdrew ₦75,000", icon: "💸", color: "text-amber-400" },
  { msg: "Amaka just cashed out ₦48,000", icon: "💰", color: "text-amber-400" },
  { msg: "Ibrahim just withdrew ₦135,000", icon: "💸", color: "text-amber-400" },
  { msg: "Funmilayo just withdrew ₦62,000", icon: "💰", color: "text-amber-400" },
  { msg: "Uche just withdrew ₦19,500", icon: "💸", color: "text-amber-400" },
  { msg: "Tolani just cashed out ₦88,000", icon: "💰", color: "text-amber-400" },

  { msg: "Gift just won ₦45,000 on Spin & Win 🎰", icon: "🏆", color: "text-primary" },
  { msg: "Samuel just won ₦120,000 on Lucky Slots", icon: "🎰", color: "text-primary" },
  { msg: "Yetunde just hit the jackpot — ₦250,000!", icon: "🎊", color: "text-primary" },
  { msg: "Kayode just won ₦18,000 on Dice Roll", icon: "🎲", color: "text-primary" },
  { msg: "Blessing just won ₦72,000 on Card Flip", icon: "🃏", color: "text-primary" },
  { msg: "Obinna just won ₦36,500 on Wheel of Fortune", icon: "🎡", color: "text-primary" },
  { msg: "Kemi just won ₦95,000 on Rocket Crash", icon: "🚀", color: "text-primary" },
  { msg: "Damilola just won ₦27,000 playing Quiz", icon: "🧠", color: "text-primary" },
  { msg: "Adeola just won ₦54,000 on Number Prediction", icon: "🔢", color: "text-primary" },
  { msg: "Nkechi just won ₦83,000 on Mystery Box", icon: "📦", color: "text-primary" },
  { msg: "Jide just won ₦41,000 on Treasure Box", icon: "💎", color: "text-primary" },
  { msg: "Rhoda just won ₦67,000 on Lucky Pick", icon: "🍀", color: "text-primary" },

  { msg: "Emmanuel just upgraded to Monthly Premium", icon: "👑", color: "text-yellow-400" },
  { msg: "Precious just got the Yearly Premium plan", icon: "💎", color: "text-yellow-400" },
  { msg: "Taiwo just became a Weekly member", icon: "⭐", color: "text-yellow-400" },
  { msg: "Adunola just upgraded to 1-Year Premium", icon: "👑", color: "text-yellow-400" },
  { msg: "Victor just joined the Monthly Premium club", icon: "💎", color: "text-yellow-400" },
  { msg: "Chiamaka just unlocked Yearly Premium", icon: "🏆", color: "text-yellow-400" },
  { msg: "Sunday just upgraded to Monthly membership", icon: "⭐", color: "text-yellow-400" },

  { msg: "Ngozi earned ₦8,500 from a referral", icon: "🤝", color: "text-purple-400" },
  { msg: "Babatunde earned ₦8,500 referring a friend", icon: "🔗", color: "text-purple-400" },
  { msg: "Uchenna just earned ₦8,500 referral bonus", icon: "🤝", color: "text-purple-400" },
  { msg: "Sade earned ₦8,500 from her 5th referral", icon: "🎯", color: "text-purple-400" },
  { msg: "Moses unlocked ₦15,000 milestone bonus!", icon: "🏆", color: "text-purple-400" },
  { msg: "Okonkwo earned ₦8,500 referring a friend", icon: "🔗", color: "text-purple-400" },

  { msg: "Gift just deposited ₦50,000", icon: "💰", color: "text-blue-400" },
  { msg: "Chidi just funded his wallet with ₦100,000", icon: "💳", color: "text-blue-400" },
  { msg: "Aisha just deposited ₦25,000", icon: "💰", color: "text-blue-400" },
  { msg: "Rotimi just funded his account ₦75,000", icon: "💳", color: "text-blue-400" },
  { msg: "Josephine just deposited ₦150,000", icon: "💰", color: "text-blue-400" },
  { msg: "Kunle just topped up ₦40,000", icon: "💳", color: "text-blue-400" },
  { msg: "Miriam just deposited ₦80,000", icon: "💰", color: "text-blue-400" },
  { msg: "David just funded his wallet ₦200,000", icon: "💳", color: "text-blue-400" },
];

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LiveActivityTicker() {
  const seed = Math.floor(Date.now() / 30000);
  const orderedRef = useRef(shuffle(EVENTS, seed));
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % orderedRef.current.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const event = orderedRef.current[idx];

  return (
    <div className="flex items-center gap-2.5 bg-card border border-border rounded-2xl px-4 py-2.5 overflow-hidden shadow-sm">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
      <span className="text-xs font-semibold text-muted-foreground shrink-0 uppercase tracking-wider">Live</span>
      <div className="flex-1 overflow-hidden relative h-5">
        <p
          className={`text-xs font-medium truncate transition-all duration-300 absolute inset-0 flex items-center gap-1 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
        >
          <span>{event.icon}</span>
          <span className={event.color}>{event.msg}</span>
        </p>
      </div>
    </div>
  );
}
