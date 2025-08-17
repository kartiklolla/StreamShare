import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Video, BarChart3, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [streamForm, setStreamForm] = useState({
    title: "",
    description: "",
    genre: "",
    costInCoins: 25,
  });

  const { data: genres = [] } = useQuery({
    queryKey: ["/api/genres"],
  });

  const { data: myStreams = [] } = useQuery({
    queryKey: ["/api/streams"],
    select: (data: any[]) => data.filter((stream: any) => stream.creatorId === user?.id),
  });

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("token");
      const response = await apiRequest("POST", "/api/streams", streamForm);
      
      toast({
        title: "Stream created!",
        description: "Your stream has been created successfully.",
      });
      
      setIsCreateModalOpen(false);
      setStreamForm({
        title: "",
        description: "",
        genre: "",
        costInCoins: 25,
      });
    } catch (error) {
      toast({
        title: "Failed to create stream",
        description: "An error occurred while creating your stream.",
        variant: "destructive",
      });
    }
  };

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

  if (!user?.isCreator) {
    return (
      <div className="text-center py-12">
        <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Creator Dashboard</h3>
        <p className="text-gray-400 mb-6">You need a creator account to access this section.</p>
        <Button className="btn-neon">
          Become a Creator
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={cardVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Creator Dashboard</h2>
          <p className="text-gray-400 mt-2">Manage your streams and track your performance</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="btn-neon">
              <Plus className="h-4 w-4 mr-2" />
              Create Stream
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-darker-bg border border-electric-blue/30 neon-glow">
            <DialogHeader>
              <DialogTitle className="gradient-text">Create New Stream</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateStream} className="space-y-4">
              <div>
                <Label htmlFor="title">Stream Title</Label>
                <Input
                  id="title"
                  value={streamForm.title}
                  onChange={(e) => setStreamForm({ ...streamForm, title: e.target.value })}
                  className="bg-dark-bg border-electric-blue/30 focus:border-electric-blue"
                  placeholder="Enter stream title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={streamForm.description}
                  onChange={(e) => setStreamForm({ ...streamForm, description: e.target.value })}
                  className="bg-dark-bg border-electric-blue/30 focus:border-electric-blue"
                  placeholder="Describe your stream"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="genre">Genre</Label>
                <Select 
                  value={streamForm.genre} 
                  onValueChange={(value) => setStreamForm({ ...streamForm, genre: value })}
                  required
                >
                  <SelectTrigger className="bg-dark-bg border-electric-blue/30 focus:border-electric-blue">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {(genres as any[]).map((genre: any) => (
                      <SelectItem key={genre.id} value={genre.name}>
                        {genre.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="cost">Cost in Coins</Label>
                <Input
                  id="cost"
                  type="number"
                  min="1"
                  value={streamForm.costInCoins}
                  onChange={(e) => setStreamForm({ ...streamForm, costInCoins: parseInt(e.target.value) })}
                  className="bg-dark-bg border-electric-blue/30 focus:border-electric-blue"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="flex-1 btn-neon">
                  <Video className="h-4 w-4 mr-2" />
                  Create Stream
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-electric-blue/30"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={cardVariants}>
          <Card className="bg-darker-bg border-electric-blue/20 neon-glow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-electric-blue">
                <Users className="h-5 w-5" />
                <span>Total Viewers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-electric-blue">
                {myStreams.reduce((total: number, stream: any) => total + stream.totalViewers, 0)}
              </div>
              <p className="text-sm text-gray-400 mt-1">Across all streams</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-darker-bg border-vibrant-purple/20 neon-glow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-vibrant-purple">
                <TrendingUp className="h-5 w-5" />
                <span>Coins Earned</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-vibrant-purple">
                {user.totalEarned}
              </div>
              <p className="text-sm text-gray-400 mt-1">Total earnings</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="bg-darker-bg border-yellow-400/20 neon-glow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-yellow-400">
                <Video className="h-5 w-5" />
                <span>Active Streams</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">
                {myStreams.filter((stream: any) => stream.isLive).length}
              </div>
              <p className="text-sm text-gray-400 mt-1">Currently live</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* My Streams */}
      <motion.div variants={cardVariants}>
        <Card className="bg-darker-bg border-electric-blue/20 neon-glow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 gradient-text">
              <BarChart3 className="h-5 w-5" />
              <span>My Streams</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myStreams.length === 0 ? (
              <div className="text-center py-12">
                <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No streams created yet</p>
                <p className="text-sm text-gray-500 mt-1">Create your first stream to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myStreams.map((stream: any) => (
                  <div 
                    key={stream.id}
                    className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-electric-blue/20"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold">{stream.title}</h4>
                        {stream.isLive && (
                          <Badge className="bg-red-500 animate-neon-pulse">LIVE</Badge>
                        )}
                        <Badge variant="outline" className="border-vibrant-purple text-vibrant-purple">
                          {stream.genre}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{stream.currentViewers} watching</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{stream.totalViewers} total</span>
                        </span>
                        <span>{stream.costInCoins} coins</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="border-electric-blue/30">
                        Edit
                      </Button>
                      {!stream.isLive ? (
                        <Button size="sm" className="btn-neon">
                          Go Live
                        </Button>
                      ) : (
                        <Button size="sm" variant="destructive">
                          End Stream
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
