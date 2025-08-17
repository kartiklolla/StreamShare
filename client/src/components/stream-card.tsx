import { motion } from "framer-motion";
import { Eye, Coins, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface StreamCardProps {
  stream: {
    id: string;
    title: string;
    creatorUsername: string;
    genre: string;
    costInCoins: number;
    currentViewers: number;
    isLive: boolean;
    thumbnailUrl?: string;
  };
  index?: number;
}

export default function StreamCard({ stream, index = 0 }: StreamCardProps) {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleJoinStream = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      setLocation("/auth");
      return;
    }

    if (user.coins < stream.costInCoins) {
      toast({
        title: "Insufficient coins",
        description: `You need ${stream.costInCoins} coins to join this stream. You have ${user.coins} coins.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/transactions/stream-join", {
        streamId: stream.id,
        userId: user.id,
      });

      const result = await response.json();
      
      // Update user's coin balance
      updateUser({ coins: result.coinsRemaining });
      
      toast({
        title: "Joined stream!",
        description: `Successfully joined ${stream.title}`,
      });

      // Navigate to stream room
      setLocation(`/stream/${stream.id}`);
    } catch (error) {
      toast({
        title: "Failed to join stream",
        description: "An error occurred while joining the stream",
        variant: "destructive",
      });
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
      className="stream-card bg-darker-bg rounded-xl overflow-hidden cursor-pointer group"
      onClick={() => setLocation(`/stream/${stream.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative">
        <div className="w-full h-48 bg-gradient-to-br from-electric-blue/20 to-vibrant-purple/20 flex items-center justify-center">
          {stream.thumbnailUrl ? (
            <img 
              src={stream.thumbnailUrl} 
              alt={stream.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Play className="h-12 w-12 text-electric-blue animate-float" />
          )}
        </div>
        
        {/* Live Badge */}
        {stream.isLive && (
          <Badge className="absolute top-3 left-3 bg-red-500 text-white animate-neon-pulse">
            LIVE
          </Badge>
        )}
        
        {/* Viewer Count */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-sm flex items-center space-x-1">
          <Eye className="h-4 w-4 text-electric-blue" />
          <span>{stream.currentViewers.toLocaleString()}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-electric-blue transition-colors">
            {stream.title}
          </h3>
          <p className="text-gray-400 text-sm">by {stream.creatorUsername}</p>
        </div>

        {/* Genre Badge */}
        <Badge 
          variant="outline" 
          className="border-vibrant-purple text-vibrant-purple"
        >
          {stream.genre}
        </Badge>

        {/* Bottom Section */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-yellow-400" />
            <span className="font-semibold">{stream.costInCoins} coins</span>
          </div>
          
          <Button
            onClick={handleJoinStream}
            className="btn-neon px-4 py-2 text-sm font-semibold"
            disabled={!user || user.coins < stream.costInCoins}
          >
            Join
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
