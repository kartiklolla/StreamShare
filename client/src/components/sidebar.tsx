import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  TrendingUp, 
  Star, 
  History, 
  Plus, 
  BarChart3, 
  Menu,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isExpanded, onToggle }: SidebarProps) {
  const { user } = useAuth();

  const sidebarVariants = {
    collapsed: { width: 60 },
    expanded: { width: 280 },
  };

  const contentVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { delay: 0.2, staggerChildren: 0.1 }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const navigationItems = [
    { icon: Home, label: "Home", active: true },
    { icon: TrendingUp, label: "Trending" },
    { icon: Star, label: "Subscriptions" },
    { icon: History, label: "History" },
  ];

  return (
    <motion.div
      className="fixed left-0 top-16 bottom-0 bg-darker-bg/95 backdrop-blur-sm border-r border-electric-blue/20 z-40 glass-effect"
      variants={sidebarVariants}
      animate={isExpanded ? "expanded" : "collapsed"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="p-4 space-y-6">
        {/* Toggle Button */}
        <Button
          onClick={onToggle}
          className="w-full p-2 bg-gradient-to-r from-electric-blue to-vibrant-purple hover:from-electric-blue/80 hover:to-vibrant-purple/80 neon-glow"
          size="sm"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              {/* Quick Access */}
              <motion.div variants={itemVariants}>
                <h3 className="text-lg font-semibold text-electric-blue mb-4">
                  Quick Access
                </h3>
                
                <nav className="space-y-3">
                  {navigationItems.map((item) => (
                    <motion.button
                      key={item.label}
                      variants={itemVariants}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        item.active 
                          ? "bg-electric-blue/20 text-electric-blue" 
                          : "hover:bg-electric-blue/10"
                      }`}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </motion.button>
                  ))}
                </nav>
              </motion.div>

              {/* Coin Management */}
              <motion.div variants={itemVariants}>
                <h4 className="text-sm font-semibold text-vibrant-purple mb-3">
                  Coin Management
                </h4>
                
                <div className="space-y-2">
                  <motion.div
                    className="bg-gradient-to-r from-electric-blue/20 to-vibrant-purple/20 p-3 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Coins className="h-5 w-5 text-yellow-400" />
                      <span className="font-semibold coin-balance">
                        {user?.coins || 0} Coins
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Current Balance</div>
                  </motion.div>

                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 neon-glow"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Buy Coins
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-electric-blue/30 hover:bg-electric-blue/10"
                    size="sm"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Transactions
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed Icons */}
        {!isExpanded && (
          <div className="space-y-3">
            {navigationItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                className={`w-full p-2 ${
                  item.active ? "text-electric-blue" : ""
                }`}
              >
                <item.icon className="h-5 w-5" />
              </Button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
