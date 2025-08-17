import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Eye, Coins, TrendingUp, Users, Video, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AnimatedLogo from "@/components/animated-logo";
import Sidebar from "@/components/sidebar";
import StreamCard from "@/components/stream-card";
import ProfileModal from "@/components/profile-modal";
import CreatorDashboard from "@/components/creator-dashboard";
import CoinSystem from "@/components/coin-system";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [activeTab, setActiveTab] = useState("streams");

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  const { data: streams = [], isLoading: streamsLoading } = useQuery({
    queryKey: ["/api/streams"],
  }) as { data: any[], isLoading: boolean };

  const { data: genres = [] } = useQuery({
    queryKey: ["/api/genres"],
  }) as { data: any[] };

  const filteredStreams = streams.filter((stream: any) => 
    selectedGenre === "All" || stream.genre === selectedGenre
  );

  const featuredStream = streams.find((stream: any) => stream.isLive) || streams[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-electric-blue/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-2 bg-gradient-to-r from-electric-blue to-vibrant-purple hover:from-electric-blue/80 hover:to-vibrant-purple/80 neon-glow"
              size="sm"
            >
              <Video className="h-5 w-5" />
            </Button>
            <AnimatedLogo />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 glass-effect px-4 py-2 rounded-full border border-electric-blue/30">
              <Coins className="h-5 w-5 text-yellow-400" />
              <span className="font-semibold coin-balance">{user.coins}</span>
              <span className="text-electric-blue text-sm">Coins</span>
            </div>
            
            <Button
              onClick={() => setIsProfileModalOpen(true)}
              className="p-0 rounded-full bg-gradient-to-r from-electric-blue to-vibrant-purple neon-glow"
              size="sm"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-transparent text-white">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <Sidebar 
        isExpanded={isSidebarExpanded} 
        onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)} 
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 pt-20 ${isSidebarExpanded ? 'pl-[296px]' : 'pl-16'}`}>
        <div className="p-6">
          {/* Tab Navigation */}
          <motion.div 
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <div className="flex space-x-4 border-b border-electric-blue/20">
              {[
                { id: "streams", label: "Discover Streams" },
                { id: "creator", label: "Creator Dashboard" },
                { id: "coins", label: "Coin System" }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  variant="ghost"
                  className={`pb-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-electric-blue text-electric-blue"
                      : "border-transparent hover:border-electric-blue/50"
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === "streams" && (
              <motion.div
                key="streams"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-8"
              >
                {/* Genre Filter */}
                <motion.div variants={sectionVariants}>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => setSelectedGenre("All")}
                      className={selectedGenre === "All" 
                        ? "btn-neon" 
                        : "border border-electric-blue/30 hover:bg-electric-blue/10 bg-transparent"
                      }
                      size="sm"
                    >
                      All
                    </Button>
                    {genres.map((genre: any) => (
                      <Button
                        key={genre.id}
                        onClick={() => setSelectedGenre(genre.name)}
                        className={selectedGenre === genre.name 
                          ? "btn-neon" 
                          : "border border-electric-blue/30 hover:bg-electric-blue/10 bg-transparent"
                        }
                        size="sm"
                      >
                        {genre.name}
                      </Button>
                    ))}
                  </div>
                </motion.div>

                {/* Featured Stream */}
                {featuredStream && (
                  <motion.div variants={sectionVariants}>
                    <Card className="bg-darker-bg border-electric-blue/30 neon-glow overflow-hidden">
                      <div className="relative">
                        <div className="w-full h-64 bg-gradient-to-br from-electric-blue/30 to-vibrant-purple/30 flex items-center justify-center">
                          <Play className="h-16 w-16 text-white animate-float" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                          <div className="flex items-center justify-between">
                            <div>
                              {featuredStream.isLive && (
                                <Badge className="bg-red-500 text-white mb-2 animate-neon-pulse">
                                  LIVE
                                </Badge>
                              )}
                              <h2 className="text-2xl font-bold mb-2">{featuredStream.title}</h2>
                              <p className="text-gray-300 mb-3">by {featuredStream.creatorUsername}</p>
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="flex items-center space-x-1">
                                  <Eye className="h-4 w-4 text-electric-blue" />
                                  <span>{featuredStream.currentViewers.toLocaleString()}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Coins className="h-4 w-4 text-yellow-400" />
                                  <span>{featuredStream.costInCoins} coins</span>
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={() => setLocation(`/stream/${featuredStream.id}`)}
                              className="btn-neon px-8 py-3 text-lg"
                            >
                              Join Stream
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Stream Grid */}
                <motion.div variants={sectionVariants}>
                  {streamsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-darker-bg rounded-xl h-80 animate-pulse" />
                      ))}
                    </div>
                  ) : filteredStreams.length === 0 ? (
                    <div className="text-center py-12">
                      <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No streams found</h3>
                      <p className="text-gray-400">
                        {selectedGenre === "All" 
                          ? "No streams are currently available" 
                          : `No streams found in ${selectedGenre} category`
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredStreams.map((stream: any, index: number) => (
                        <StreamCard key={stream.id} stream={stream} index={index} />
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {activeTab === "creator" && (
              <motion.div
                key="creator"
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <CreatorDashboard />
              </motion.div>
            )}

            {activeTab === "coins" && (
              <motion.div
                key="coins"
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <CoinSystem />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
}
