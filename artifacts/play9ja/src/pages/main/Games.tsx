import { useListGames, usePlayGame } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Flame } from "lucide-react";
import type { Game } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Games() {
  const { data: games, isLoading } = useListGames();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  
  const playMutation = usePlayGame();
  const { toast } = useToast();

  const handlePlayClick = (game: Game) => {
    setSelectedGame(game);
    setIsPlayModalOpen(true);
  };

  const executePlay = () => {
    if (!selectedGame) return;
    
    playMutation.mutate({ id: selectedGame.id!, data: {} }, {
      onSuccess: (result) => {
        if (result.won) {
          toast({
            title: "🎉 You Won!",
            description: result.message,
            className: "bg-accent text-accent-foreground border-none",
          });
        } else {
          toast({
            title: "Better luck next time!",
            description: result.message,
          });
        }
        setIsPlayModalOpen(false);
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">Game Lobby</h1>
        <p className="text-muted-foreground">Play games, win real Naira.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {games?.map((game) => (
            <Card key={game.id} className="rounded-2xl border-none shadow-sm hover:shadow-xl transition-all cursor-pointer group overflow-hidden bg-card" onClick={() => handlePlayClick(game)}>
              <CardContent className="p-4 flex flex-col items-center text-center relative h-full">
                {game.isPremium && (
                  <div className="absolute top-2 right-2 text-primary">
                    <Lock className="w-4 h-4" />
                  </div>
                )}
                {game.difficulty === 'hard' && (
                  <div className="absolute top-2 left-2 text-destructive">
                    <Flame className="w-4 h-4" />
                  </div>
                )}
                <div className="text-5xl my-4 group-hover:scale-110 transition-transform">{game.emoji}</div>
                <h3 className="font-bold font-display text-lg mb-1 leading-tight">{game.name}</h3>
                <div className="mt-auto pt-4 w-full">
                  <Badge variant="secondary" className="w-full justify-center bg-primary/10 text-primary hover:bg-primary/20">
                    Up to ₦{game.maxReward}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isPlayModalOpen} onOpenChange={setIsPlayModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-display">
              <span className="text-3xl">{selectedGame?.emoji}</span> {selectedGame?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedGame?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
            <div className="text-center p-4 bg-muted rounded-xl w-full">
              <div className="text-sm text-muted-foreground mb-1">Potential Reward</div>
              <div className="text-3xl font-bold text-primary">₦{selectedGame?.minReward} - ₦{selectedGame?.maxReward}</div>
            </div>
            
            <Button 
              className="w-full h-14 text-xl font-bold rounded-xl shadow-lg gold-gradient border-none"
              onClick={executePlay}
              disabled={playMutation.isPending}
            >
              {playMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "PLAY NOW"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}