import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegisterUser } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  
  const registerMutation = useRegisterUser();
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    registerMutation.mutate({ data: { username, email, password, referralCode: referralCode || undefined } }, {
      onSuccess: (data) => {
        login(data.token, data.user);
        toast({
          title: "🎉 Welcome Bonus Credited!",
          description: "₦8,500 has been added to your wallet.",
          className: "bg-primary text-primary-foreground border-none",
        });
        setLocation("/");
      },
      onError: (err) => {
        toast({
          title: "Registration Failed",
          description: err.message || "An error occurred",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md p-8 glass-panel rounded-3xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold tracking-tight">Join Play9ja</h1>
          <p className="text-muted-foreground mt-2">Get ₦8,500 bonus when you sign up today!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="CoolPlayer" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-xl bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral">Referral Code (Optional)</Label>
              <Input 
                id="referral" 
                placeholder="e.g. VIP2024" 
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="h-12 rounded-xl bg-background/50 uppercase"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all gold-gradient"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Claim ₦8,500 Bonus"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}