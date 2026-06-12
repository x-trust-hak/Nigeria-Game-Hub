import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRequestPasswordReset } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const resetMutation = useRequestPasswordReset();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return;
    }

    resetMutation.mutate({ data: { email } }, {
      onSuccess: () => {
        toast({
          title: "Email Sent",
          description: "Check your email for reset instructions.",
        });
        setLocation("/login");
      },
      onError: (err) => {
        toast({
          title: "Request Failed",
          description: err.message,
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md p-8 glass-panel rounded-3xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold tracking-tight">Reset Password</h1>
          <p className="text-muted-foreground mt-2">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
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
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 rounded-xl text-lg font-bold shadow-lg"
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Send Reset Link"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}