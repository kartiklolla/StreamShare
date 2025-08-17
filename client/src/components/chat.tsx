import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  createdAt: string;
  userId: string;
}

interface ChatProps {
  streamId: string;
  initialMessages?: ChatMessage[];
}

export default function Chat({ streamId, initialMessages = [] }: ChatProps) {
  const { user } = useAuth();
  const { sendChatMessage, messages: wsMessages } = useWebSocket();
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle new chat messages from WebSocket
    const newChatMessages = wsMessages
      .filter(msg => msg.type === 'new_chat_message' && msg.message.streamId === streamId)
      .map(msg => msg.message);
    
    if (newChatMessages.length > 0) {
      setMessages(prev => [...prev, ...newChatMessages]);
    }
  }, [wsMessages, streamId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !user) return;
    
    sendChatMessage(messageInput.trim());
    setMessageInput("");
  };

  const messageVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.8 },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 30 
      }
    },
    exit: { 
      opacity: 0, 
      x: 20, 
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-darker-bg border-l border-electric-blue/20">
      {/* Chat Header */}
      <div className="p-4 border-b border-electric-blue/20 glass-effect">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-electric-blue" />
          <h3 className="font-semibold text-electric-blue">Live Chat</h3>
          <span className="text-xs text-gray-400 ml-auto">
            {messages.length} messages
          </span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={`${message.id}-${index}`}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className="flex space-x-3 group"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-r from-electric-blue to-vibrant-purple text-white text-xs">
                    {message.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm text-electric-blue">
                      {message.username}
                    </span>
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm break-words">{message.message}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-electric-blue/20 glass-effect">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={user ? "Type a message..." : "Login to chat"}
            className="flex-1 bg-dark-bg border-electric-blue/30 focus:border-electric-blue text-sm"
            disabled={!user}
            maxLength={500}
          />
          <Button
            type="submit"
            size="sm"
            className="btn-neon px-3"
            disabled={!messageInput.trim() || !user}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        {!user && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            You need to be logged in to participate in chat
          </p>
        )}
      </div>
    </div>
  );
}
