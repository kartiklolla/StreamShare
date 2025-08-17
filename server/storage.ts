import { type User, type InsertUser, type Stream, type InsertStream, type Transaction, type InsertTransaction, type Genre, type InsertGenre, type ChatMessage, type InsertChatMessage, type StreamSession, type InsertStreamSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserCoins(id: string, amount: number): Promise<User | undefined>;

  // Streams
  getStream(id: string): Promise<Stream | undefined>;
  getStreams(filters?: { genre?: string; isLive?: boolean }): Promise<Stream[]>;
  getStreamsByCreator(creatorId: string): Promise<Stream[]>;
  createStream(stream: InsertStream): Promise<Stream>;
  updateStream(id: string, updates: Partial<Stream>): Promise<Stream | undefined>;
  deleteStream(id: string): Promise<boolean>;

  // Transactions
  getTransactions(userId?: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactionHistory(userId: string): Promise<Transaction[]>;

  // Genres
  getGenres(): Promise<Genre[]>;
  getGenre(id: string): Promise<Genre | undefined>;
  createGenre(genre: InsertGenre): Promise<Genre>;

  // Chat Messages
  getChatMessages(streamId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Stream Sessions
  createStreamSession(session: InsertStreamSession): Promise<StreamSession>;
  endStreamSession(sessionId: string): Promise<StreamSession | undefined>;
  getActiveStreamSessions(streamId: string): Promise<StreamSession[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private streams: Map<string, Stream> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private genres: Map<string, Genre> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();
  private streamSessions: Map<string, StreamSession> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default genres
    const defaultGenres = [
      { name: "Gaming", description: "Live gaming streams", color: "#00BFFF" },
      { name: "Music", description: "Live music performances", color: "#8A2BE2" },
      { name: "Art", description: "Creative art streams", color: "#FF6B6B" },
      { name: "Tech", description: "Technology and programming", color: "#4ECDC4" },
      { name: "Education", description: "Educational content", color: "#45B7D1" },
    ];

    defaultGenres.forEach(genre => {
      const id = randomUUID();
      this.genres.set(id, { id, ...genre });
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      coins: 100,
      isCreator: insertUser.isCreator || false,
      avatar: insertUser.avatar || null,
      totalWatched: 0,
      totalEarned: 0,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserCoins(id: string, amount: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, coins: user.coins + amount };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Streams
  async getStream(id: string): Promise<Stream | undefined> {
    return this.streams.get(id);
  }

  async getStreams(filters?: { genre?: string; isLive?: boolean }): Promise<Stream[]> {
    let streams = Array.from(this.streams.values());
    
    if (filters?.genre) {
      streams = streams.filter(stream => stream.genre === filters.genre);
    }
    
    if (filters?.isLive !== undefined) {
      streams = streams.filter(stream => stream.isLive === filters.isLive);
    }
    
    return streams.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getStreamsByCreator(creatorId: string): Promise<Stream[]> {
    return Array.from(this.streams.values()).filter(stream => stream.creatorId === creatorId);
  }

  async createStream(insertStream: InsertStream): Promise<Stream> {
    const id = randomUUID();
    const stream: Stream = {
      ...insertStream,
      id,
      description: insertStream.description || null,
      thumbnailUrl: insertStream.thumbnailUrl || null,
      isLive: false,
      currentViewers: 0,
      totalViewers: 0,
      streamKey: randomUUID(),
      createdAt: new Date()
    };
    this.streams.set(id, stream);
    return stream;
  }

  async updateStream(id: string, updates: Partial<Stream>): Promise<Stream | undefined> {
    const stream = this.streams.get(id);
    if (!stream) return undefined;
    
    const updatedStream = { ...stream, ...updates };
    this.streams.set(id, updatedStream);
    return updatedStream;
  }

  async deleteStream(id: string): Promise<boolean> {
    return this.streams.delete(id);
  }

  // Transactions
  async getTransactions(userId?: string): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values());
    
    if (userId) {
      transactions = transactions.filter(t => t.userId === userId);
    }
    
    return transactions.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      streamId: insertTransaction.streamId || null,
      creatorId: insertTransaction.creatorId || null,
      description: insertTransaction.description || null,
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getUserTransactionHistory(userId: string): Promise<Transaction[]> {
    return this.getTransactions(userId);
  }

  // Genres
  async getGenres(): Promise<Genre[]> {
    return Array.from(this.genres.values());
  }

  async getGenre(id: string): Promise<Genre | undefined> {
    return this.genres.get(id);
  }

  async createGenre(insertGenre: InsertGenre): Promise<Genre> {
    const id = randomUUID();
    const genre: Genre = { 
      ...insertGenre, 
      id,
      description: insertGenre.description || null,
      color: insertGenre.color || null
    };
    this.genres.set(id, genre);
    return genre;
  }

  // Chat Messages
  async getChatMessages(streamId: string, limit: number = 50): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(msg => msg.streamId === streamId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit)
      .reverse();
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date()
    };
    this.chatMessages.set(id, message);
    return message;
  }

  // Stream Sessions
  async createStreamSession(insertSession: InsertStreamSession): Promise<StreamSession> {
    const id = randomUUID();
    const session: StreamSession = {
      ...insertSession,
      id,
      joinedAt: new Date(),
      leftAt: null
    };
    this.streamSessions.set(id, session);
    return session;
  }

  async endStreamSession(sessionId: string): Promise<StreamSession | undefined> {
    const session = this.streamSessions.get(sessionId);
    if (!session) return undefined;
    
    const updatedSession = { ...session, leftAt: new Date() };
    this.streamSessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async getActiveStreamSessions(streamId: string): Promise<StreamSession[]> {
    return Array.from(this.streamSessions.values())
      .filter(session => session.streamId === streamId && !session.leftAt);
  }
}

export const storage = new MemStorage();
