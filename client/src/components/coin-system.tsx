import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Plus, TrendingUp, History, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface CoinPackage {
  coins: number;
  price: number;
  popular?: boolean;
  bonus?: number;
}

export default function CoinSystem() {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  }) as { data: any[] };

  const coinPackages: CoinPackage[] = [
    { coins: 100, price: 9.99 },
    { coins: 500, price: 39.99, popular: true, bonus: 50 },
    { coins: 1000, price: 74.99, bonus: 150 },
    { coins: 2500, price: 174.99, bonus: 500 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'stream_join':
        return 'text-red-400 border-red-500/30';
      case 'coin_purchase':
        return 'text-green-400 border-green-500/30';
      case 'creator_earning':
        return 'text-blue-400 border-blue-500/30';
      default:
        return 'text-gray-400 border-gray-500/30';
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={cardVariants} className="text-center">
        <h2 className="text-3xl font-bold gradient-text mb-4">Coin System</h2>
        <p className="text-gray-400">Manage your coins and view transaction history</p>
      </motion.div>

      {/* Current Balance */}
      <motion.div variants={cardVariants}>
        <Card className="bg-darker-bg border-electric-blue/20 neon-glow">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Coins className="h-10 w-10 text-white" />
              </div>
              <div className="text-4xl font-bold coin-balance mb-2">
                {user?.coins || 0}
              </div>
              <p className="text-gray-400">Current Coins</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Coin Packages */}
      <motion.div variants={cardVariants}>
        <Card className="bg-darker-bg border-electric-blue/20 neon-glow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 gradient-text">
              <Plus className="h-5 w-5" />
              <span>Buy Coins</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {coinPackages.map((pkg, index) => (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                    pkg.popular
                      ? 'border-vibrant-purple bg-vibrant-purple/10 neon-glow'
                      : 'border-electric-blue/30 hover:border-electric-blue/50 hover:bg-electric-blue/5'
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500">
                      POPULAR
                    </Badge>
                  )}
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-electric-blue mb-1">
                      {pkg.coins}
                      {pkg.bonus && (
                        <span className="text-sm text-green-400 ml-1">
                          +{pkg.bonus}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mb-3">Coins</div>
                    <div className="text-xl font-semibold mb-3">
                      ${pkg.price}
                    </div>
                    {pkg.bonus && (
                      <div className="text-xs text-green-400 mb-2">
                        +{pkg.bonus} bonus coins!
                      </div>
                    )}
                    <Button 
                      className="w-full btn-neon text-sm"
                      size="sm"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      Purchase
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={cardVariants}>
        <Card className="bg-darker-bg border-electric-blue/20 neon-glow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 gradient-text">
              <History className="h-5 w-5" />
              <span>Recent Transactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No transactions yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Start by purchasing coins or joining streams
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 10).map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-l-2 pl-4 bg-dark-bg ${getTransactionColor(transaction.type)}`}
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {transaction.description || transaction.type}
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatDate(transaction.createdAt)}
                      </div>
                    </div>
                    <div className={`font-bold ${
                      transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount} coins
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={cardVariants}>
          <Card className="bg-darker-bg border-green-500/20 neon-glow">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {transactions.filter((t: any) => t.amount > 0).reduce((sum: number, t: any) => sum + t.amount, 0)}
                  </div>
                  <div className="text-sm text-gray-400">Total Earned</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-darker-bg border-red-500/20 neon-glow">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-red-400 rotate-180" />
                <div>
                  <div className="text-2xl font-bold text-red-400">
                    {Math.abs(transactions.filter((t: any) => t.amount < 0).reduce((sum: number, t: any) => sum + t.amount, 0))}
                  </div>
                  <div className="text-sm text-gray-400">Total Spent</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-darker-bg border-electric-blue/20 neon-glow">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <History className="h-8 w-8 text-electric-blue" />
                <div>
                  <div className="text-2xl font-bold text-electric-blue">
                    {transactions.length}
                  </div>
                  <div className="text-sm text-gray-400">Total Transactions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
