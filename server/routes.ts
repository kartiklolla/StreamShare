import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { 
  registerSchema, 
  loginSchema, 
  insertStreamSchema, 
  joinStreamSchema,
  insertChatMessageSchema,
  insertTransactionSchema
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "streamshare-secret-key";

interface AuthenticatedRequest extends Request {
  user?: { id: string; username: string };
}

// JWT middleware
const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
    const user = await storage.getUser(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = { id: user.id, username: user.username };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const activeConnections = new Map<string, { ws: WebSocket; userId: string; streamId?: string }>();

  wss.on('connection', (ws, req) => {
    const connectionId = Math.random().toString(36).substring(7);
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'authenticate':
            try {
              const decoded = jwt.verify(message.token, JWT_SECRET) as { id: string; username: string };
              const user = await storage.getUser(decoded.id);
              if (user) {
                activeConnections.set(connectionId, { ws, userId: user.id });
                ws.send(JSON.stringify({ type: 'authenticated', userId: user.id }));
              }
            } catch (error) {
              ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
            }
            break;

          case 'join_stream':
            const connection = activeConnections.get(connectionId);
            if (connection) {
              connection.streamId = message.streamId;
              activeConnections.set(connectionId, connection);
              
              // Broadcast to other users in the stream
              Array.from(activeConnections.values())
                .filter(conn => conn.streamId === message.streamId && conn.userId !== connection.userId)
                .forEach(conn => {
                  if (conn.ws.readyState === WebSocket.OPEN) {
                    conn.ws.send(JSON.stringify({
                      type: 'user_joined',
                      streamId: message.streamId,
                      userId: connection.userId
                    }));
                  }
                });
            }
            break;

          case 'leave_stream':
            const leavingConnection = activeConnections.get(connectionId);
            if (leavingConnection && leavingConnection.streamId) {
              const streamId = leavingConnection.streamId;
              leavingConnection.streamId = undefined;
              activeConnections.set(connectionId, leavingConnection);
              
              // Broadcast to other users in the stream
              Array.from(activeConnections.values())
                .filter(conn => conn.streamId === streamId && conn.userId !== leavingConnection.userId)
                .forEach(conn => {
                  if (conn.ws.readyState === WebSocket.OPEN) {
                    conn.ws.send(JSON.stringify({
                      type: 'user_left',
                      streamId: streamId,
                      userId: leavingConnection.userId
                    }));
                  }
                });
            }
            break;

          case 'chat_message':
            const chatConnection = activeConnections.get(connectionId);
            if (chatConnection && chatConnection.streamId) {
              // Save chat message
              const chatMessage = await storage.createChatMessage({
                streamId: chatConnection.streamId,
                userId: chatConnection.userId,
                message: message.content
              });

              // Get user info for the message
              const user = await storage.getUser(chatConnection.userId);
              
              // Broadcast to all users in the stream
              Array.from(activeConnections.values())
                .filter(conn => conn.streamId === chatConnection.streamId)
                .forEach(conn => {
                  if (conn.ws.readyState === WebSocket.OPEN) {
                    conn.ws.send(JSON.stringify({
                      type: 'new_chat_message',
                      message: {
                        ...chatMessage,
                        username: user?.username || 'Unknown'
                      }
                    }));
                  }
                });
            }
            break;

          case 'webrtc_signal':
            // Forward WebRTC signaling between peers
            const signalingConnection = activeConnections.get(connectionId);
            if (signalingConnection && message.targetUserId) {
              const targetConnection = Array.from(activeConnections.values())
                .find(conn => conn.userId === message.targetUserId);
              
              if (targetConnection && targetConnection.ws.readyState === WebSocket.OPEN) {
                targetConnection.ws.send(JSON.stringify({
                  type: 'webrtc_signal',
                  signal: message.signal,
                  fromUserId: signalingConnection.userId
                }));
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      const connection = activeConnections.get(connectionId);
      if (connection && connection.streamId) {
        // Notify other users in the stream
        Array.from(activeConnections.values())
          .filter(conn => conn.streamId === connection.streamId && conn.userId !== connection.userId)
          .forEach(conn => {
            if (conn.ws.readyState === WebSocket.OPEN) {
              conn.ws.send(JSON.stringify({
                type: 'user_left',
                streamId: connection.streamId,
                userId: connection.userId
              }));
            }
          });
      }
      activeConnections.delete(connectionId);
    });
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username) || 
                           await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        isCreator: userData.isCreator || false,
        avatar: userData.avatar
      });

      // Generate token
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          coins: user.coins,
          isCreator: user.isCreator,
          avatar: user.avatar
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          coins: user.coins,
          isCreator: user.isCreator,
          avatar: user.avatar,
          totalWatched: user.totalWatched,
          totalEarned: user.totalEarned
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  // User routes
  app.get("/api/users/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        id: user.id, 
        username: user.username, 
        email: user.email,
        coins: user.coins,
        isCreator: user.isCreator,
        avatar: user.avatar,
        totalWatched: user.totalWatched,
        totalEarned: user.totalEarned
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/users/balance", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ coins: user.coins });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Stream routes
  app.get("/api/streams", async (req, res) => {
    try {
      const { genre, isLive } = req.query;
      const filters: any = {};
      
      if (genre) filters.genre = genre as string;
      if (isLive !== undefined) filters.isLive = isLive === 'true';
      
      const streams = await storage.getStreams(filters);
      
      // Get creator info for each stream
      const streamsWithCreators = await Promise.all(
        streams.map(async (stream) => {
          const creator = await storage.getUser(stream.creatorId);
          return {
            ...stream,
            creatorUsername: creator?.username || 'Unknown',
            creatorAvatar: creator?.avatar
          };
        })
      );
      
      res.json(streamsWithCreators);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/streams/:id", async (req, res) => {
    try {
      const stream = await storage.getStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      const creator = await storage.getUser(stream.creatorId);
      res.json({
        ...stream,
        creatorUsername: creator?.username || 'Unknown',
        creatorAvatar: creator?.avatar
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/streams", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const streamData = insertStreamSchema.parse(req.body);
      
      const stream = await storage.createStream({
        ...streamData,
        creatorId: req.user!.id
      });
      
      res.json(stream);
    } catch (error) {
      res.status(400).json({ message: "Invalid stream data" });
    }
  });

  app.patch("/api/streams/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const stream = await storage.getStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      if (stream.creatorId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedStream = await storage.updateStream(req.params.id, req.body);
      res.json(updatedStream);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  // Transaction routes
  app.post("/api/transactions/stream-join", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { streamId } = joinStreamSchema.parse(req.body);
      
      const stream = await storage.getStream(streamId);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.coins < stream.costInCoins) {
        return res.status(400).json({ message: "Insufficient coins" });
      }
      
      // Deduct coins from user
      await storage.updateUserCoins(user.id, -stream.costInCoins);
      
      // Add coins to creator
      await storage.updateUserCoins(stream.creatorId, stream.costInCoins);
      
      // Create transaction records
      await storage.createTransaction({
        userId: user.id,
        streamId: stream.id,
        creatorId: stream.creatorId,
        amount: -stream.costInCoins,
        type: 'stream_join',
        description: `Joined stream: ${stream.title}`
      });
      
      await storage.createTransaction({
        userId: stream.creatorId,
        streamId: stream.id,
        amount: stream.costInCoins,
        type: 'creator_earning',
        description: `Earning from stream: ${stream.title}`
      });
      
      // Create stream session
      await storage.createStreamSession({
        streamId: stream.id,
        userId: user.id,
        coinsSpent: stream.costInCoins
      });
      
      // Update stream viewer count
      await storage.updateStream(stream.id, {
        currentViewers: stream.currentViewers + 1,
        totalViewers: stream.totalViewers + 1
      });
      
      res.json({ message: "Successfully joined stream", coinsRemaining: user.coins - stream.costInCoins });
    } catch (error) {
      res.status(400).json({ message: "Failed to join stream" });
    }
  });

  app.get("/api/transactions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const transactions = await storage.getUserTransactionHistory(req.user!.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Genre routes
  app.get("/api/genres", async (req, res) => {
    try {
      const genres = await storage.getGenres();
      res.json(genres);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Chat routes
  app.get("/api/streams/:streamId/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.streamId);
      
      // Get usernames for messages
      const messagesWithUsernames = await Promise.all(
        messages.map(async (message) => {
          const user = await storage.getUser(message.userId);
          return {
            ...message,
            username: user?.username || 'Unknown'
          };
        })
      );
      
      res.json(messagesWithUsernames);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  return httpServer;
}
