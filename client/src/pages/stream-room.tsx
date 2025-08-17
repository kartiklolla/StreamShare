import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { X, Eye, Users, ArrowLeft, Settings, Maximize, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Chat from "@/components/chat";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { WebRTCManager } from "@/lib/webrtc";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function StreamRoom() {
  const [, params] = useRoute("/stream/:streamId");
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { joinStream, leaveStream, sendWebRTCSignal, messages, isConnected } = useWebSocket();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [webrtcManager] = useState(() => new WebRTCManager());
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamId = params?.streamId;

  const { data: stream, isLoading } = useQuery({
    queryKey: ["/api/streams", streamId],
    enabled: !!streamId,
  }) as { data: any, isLoading: boolean };

  const { data: chatMessages = [] } = useQuery({
    queryKey: ["/api/streams", streamId, "messages"],
    enabled: !!streamId,
  }) as { data: any[] };

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
      return;
    }

    if (streamId && isConnected) {
      joinStream(streamId);
    }

    return () => {
      if (streamId) {
        leaveStream();
      }
    };
  }, [streamId, isConnected, user, setLocation]);

  useEffect(() => {
    // Handle WebRTC signaling messages
    const webrtcMessages = messages.filter(msg => msg.type === 'webrtc_signal');
    webrtcMessages.forEach(msg => {
      webrtcManager.handleSignal(msg.signal);
    });
  }, [messages, webrtcManager]);

  useEffect(() => {
    // Set up WebRTC callbacks
    webrtcManager.onRemoteStream((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    webrtcManager.onSignal((signal, targetUserId) => {
      sendWebRTCSignal(signal, targetUserId || '');
    });

    return () => {
      webrtcManager.disconnect();
    };
  }, [webrtcManager, sendWebRTCSignal]);

  const handleFullscreen = () => {
    if (!isFullscreen && videoRef.current) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLeaveStream = () => {
    leaveStream();
    webrtcManager.disconnect();
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue mx-auto mb-4"></div>
          <p className="text-gray-400">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <Card className="bg-darker-bg border-electric-blue/30 p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Stream Not Found</h2>
            <p className="text-gray-400 mb-6">The stream you're looking for doesn't exist or has ended.</p>
            <Button onClick={() => setLocation("/")} className="btn-neon">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Stream Header */}
      <div className="bg-darker-bg/95 backdrop-blur-sm border-b border-electric-blue/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleLeaveStream}
              variant="ghost"
              size="sm"
              className="hover:bg-electric-blue/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{stream.title}</h1>
              <p className="text-gray-400">by {stream.creatorUsername}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {stream.isLive && (
              <Badge className="bg-red-500 animate-neon-pulse">LIVE</Badge>
            )}
            <div className="flex items-center space-x-2 text-electric-blue">
              <Eye className="h-4 w-4" />
              <span>{stream.currentViewers.toLocaleString()}</span>
            </div>
            <Button
              onClick={handleLeaveStream}
              variant="ghost"
              size="sm"
              className="text-red-400 hover:bg-red-500/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Video Player Area */}
        <div className="flex-1 relative">
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              controls
              autoPlay
              muted={isMuted}
              onLoadedMetadata={() => {
                // Video is ready
                toast({
                  title: "Stream connected",
                  description: "You are now watching the live stream",
                });
              }}
            />
            
            {/* Video Overlay Controls */}
            <div className="absolute bottom-4 right-4 flex space-x-2">
              <Button
                onClick={handleMute}
                size="sm"
                className="bg-black/50 hover:bg-black/70"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                onClick={handleFullscreen}
                size="sm"
                className="bg-black/50 hover:bg-black/70"
              >
                <Maximize className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="bg-black/50 hover:bg-black/70"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {/* Connection Status */}
            <div className="absolute top-4 left-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isConnected 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
              </div>
            </div>

            {/* Stream Info Overlay */}
            <div className="absolute top-4 right-4 glass-effect p-3 rounded-lg">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-electric-blue" />
                  <span>{stream.currentViewers} watching</span>
                </div>
                <Badge variant="outline" className="border-vibrant-purple text-vibrant-purple">
                  {stream.genre}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-80">
          <Chat streamId={streamId!} initialMessages={chatMessages} />
        </div>
      </div>
    </div>
  );
}
