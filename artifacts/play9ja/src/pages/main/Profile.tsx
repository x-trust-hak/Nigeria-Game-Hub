import { useGetProfile, useLogoutUser } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Star, Award, Shield, Settings, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  const { user, logout } = useAuth();
  const { data: profile } = useGetProfile({
    query: { enabled: !!user }
  });

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
          <AvatarImage src={profile?.avatarUrl || ""} />
          <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
            {user?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-display font-bold">{user?.username}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
          {profile?.membershipStatus === 'active' && (
            <div className="flex items-center gap-1 mt-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full w-fit">
              <Star className="w-3 h-3 fill-current" /> Premium Member
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Games Played", value: profile?.gamesPlayed || 0 },
          { label: "Total Referrals", value: profile?.totalReferrals || 0 },
          { label: "Daily Streak", value: `${profile?.dailyStreak || 0} 🔥` },
          { label: "Pending", value: `₦${profile?.pendingBalance?.toLocaleString() || 0}` },
        ].map((stat, i) => (
          <Card key={i} className="rounded-2xl border-none shadow-sm bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg px-2">Account Settings</h3>
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {[
              { icon: Shield, label: "Security & Password", href: "/profile/security" },
              { icon: Settings, label: "Preferences", href: "/profile/settings" },
              { icon: Award, label: "Achievements", href: "/rewards" },
            ].map((item, i) => (
              <Link key={i} href={item.href} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Button 
        variant="destructive" 
        className="w-full h-14 rounded-xl text-lg font-bold mt-8"
        onClick={() => logout()}
      >
        <LogOut className="w-5 h-5 mr-2" />
        Log Out
      </Button>
    </div>
  );
}