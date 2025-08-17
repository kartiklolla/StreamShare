import { motion, AnimatePresence } from "framer-motion";
import { X, Edit, History, Trophy, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        damping: 20, 
        stiffness: 300 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50,
      transition: { duration: 0.2 }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-darker-bg border border-electric-blue/30 max-w-md mx-4 neon-glow">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <DialogHeader>
                <DialogTitle className="text-center text-2xl font-bold gradient-text">
                  Profile
                </DialogTitle>
              </DialogHeader>

              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6 pt-4"
              >
                {/* Avatar and Basic Info */}
                <motion.div variants={itemVariants} className="text-center">
                  <div className="relative mx-auto mb-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-electric-blue to-vibrant-purple p-1">
                      <Avatar className="w-full h-full">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-darker-bg text-white text-xl">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {user.isCreator && (
                      <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500">
                        <Trophy className="h-3 w-3 mr-1" />
                        Creator
                      </Badge>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-2">{user.username}</h2>
                  <p className="text-gray-400 mb-4">{user.email}</p>
                  
                  {/* Coin Balance */}
                  <div className="bg-gradient-to-r from-electric-blue/20 to-vibrant-purple/20 p-4 rounded-lg border border-electric-blue/30">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Coins className="h-6 w-6 text-yellow-400" />
                      <span className="text-2xl font-bold coin-balance">
                        {user.coins}
                      </span>
                      <span className="text-electric-blue">Coins</span>
                    </div>
                    <div className="text-sm text-gray-400">Current Balance</div>
                  </div>
                </motion.div>

                {/* User Stats */}
                <motion.div variants={itemVariants}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-electric-blue/10 rounded-lg border border-electric-blue/20">
                      <div className="text-xl font-bold text-electric-blue">
                        {user.totalWatched}
                      </div>
                      <div className="text-sm text-gray-400">Streams Watched</div>
                    </div>
                    <div className="text-center p-3 bg-vibrant-purple/10 rounded-lg border border-vibrant-purple/20">
                      <div className="text-xl font-bold text-vibrant-purple">
                        {user.totalEarned}
                      </div>
                      <div className="text-sm text-gray-400">
                        {user.isCreator ? "Coins Earned" : "Coins Spent"}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <Button
                    className="w-full btn-neon"
                    onClick={() => {/* TODO: Implement edit profile */}}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full border-electric-blue/30 hover:bg-electric-blue/10"
                    onClick={() => {/* TODO: Implement view history */}}
                  >
                    <History className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full border-red-500/30 hover:bg-red-500/10 text-red-400"
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                  >
                    Logout
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
