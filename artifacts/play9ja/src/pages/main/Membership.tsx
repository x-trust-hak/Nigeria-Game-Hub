import { useListMembershipPlans, usePurchaseMembership, useGetMembershipStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Star, Loader2 } from "lucide-react";
import { useState } from "react";

export default function Membership() {
  const { data: plans, isLoading: isPlansLoading } = useListMembershipPlans();
  const { data: status } = useGetMembershipStatus();
  const purchaseMutation = usePurchaseMembership();
  const { toast } = useToast();
  
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  const handlePurchase = (planId: number) => {
    setSelectedPlan(planId);
    purchaseMutation.mutate({ data: { planId } }, {
      onSuccess: () => {
        toast({
          title: "Request Submitted",
          description: "Your membership upgrade request is pending approval.",
        });
        setSelectedPlan(null);
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive"
        });
        setSelectedPlan(null);
      }
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24 max-w-5xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <Badge variant="secondary" className="mb-4 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
          <Star className="w-3 h-3 mr-1 fill-current" /> PREMIUM ACCESS
        </Badge>
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">
          Unlock the Full Play9ja Experience
        </h1>
        <p className="text-lg text-muted-foreground">
          Get exclusive games, higher limits, faster withdrawals, and premium support.
        </p>
      </div>

      {status?.isActive && (
        <Card className="gold-gradient rounded-3xl border-none shadow-xl text-black">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="font-bold text-lg uppercase tracking-wider opacity-80 mb-1">Active Plan</div>
              <div className="text-3xl font-display font-bold">{status.planName}</div>
            </div>
            <div className="text-center md:text-right">
              <div className="font-bold text-sm uppercase tracking-wider opacity-80 mb-1">Time Remaining</div>
              <div className="text-2xl font-bold">{status.daysRemaining} Days {status.hoursRemaining} Hrs</div>
            </div>
          </CardContent>
        </Card>
      )}

      {status?.isPending && (
        <Card className="bg-orange-500/10 border-orange-500/20 rounded-3xl text-orange-600">
          <CardContent className="p-6 text-center font-bold">
            Your membership upgrade is currently pending review.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {plans?.map((plan) => (
          <Card key={plan.id} className={`rounded-3xl border ${plan.isPopular ? 'border-primary shadow-xl scale-105 z-10 relative' : 'border-border shadow-sm'} bg-card overflow-hidden flex flex-col`}>
            {plan.isPopular && (
              <div className="bg-primary text-primary-foreground text-center py-1.5 text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
            )}
            <CardContent className="p-6 md:p-8 flex-1 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-muted-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold">₦{plan.price.toLocaleString()}</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1">
                {plan.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-primary shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full h-12 rounded-xl font-bold ${plan.isPopular ? 'gold-gradient text-black' : ''}`}
                variant={plan.isPopular ? 'default' : 'outline'}
                onClick={() => handlePurchase(plan.id)}
                disabled={purchaseMutation.isPending || status?.isActive || status?.isPending}
              >
                {purchaseMutation.isPending && selectedPlan === plan.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Choose Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}