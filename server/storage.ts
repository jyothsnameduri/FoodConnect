import {
  users,
  foodPosts,
  foodPostImages,
  type User,
  type InsertUser,
  type FoodPost,
  type InsertFoodPost,
  type UpdateFoodPost,
  type FoodPostImage,
  type InsertFoodPostImage
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, inArray, desc, gt, lt, gte, lte, like, or } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Food post operations
  createFoodPost(post: InsertFoodPost): Promise<FoodPost>;
  getFoodPost(id: number): Promise<FoodPost | undefined>;
  getFoodPosts(options?: {
    type?: "donation" | "request";
    userId?: number;
    status?: string;
    category?: string[];
    dietary?: string[];
    search?: string;
    nearLatitude?: number;
    nearLongitude?: number;
    maxDistance?: number;
    limit?: number;
    offset?: number;
  }): Promise<FoodPost[]>;
  updateFoodPost(id: number, post: Partial<UpdateFoodPost>): Promise<FoodPost | undefined>;
  deleteFoodPost(id: number): Promise<boolean>;
  
  // Food post image operations
  addFoodPostImage(image: InsertFoodPostImage): Promise<FoodPostImage>;
  getFoodPostImages(postId: number): Promise<FoodPostImage[]>;
  deleteFoodPostImage(id: number): Promise<boolean>;
  
  sessionStore: session.Store;
}

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createFoodPost(post: InsertFoodPost): Promise<FoodPost> {
    const [newPost] = await db
      .insert(foodPosts)
      .values(post)
      .returning();
    return newPost;
  }

  async getFoodPost(id: number): Promise<FoodPost | undefined> {
    const [post] = await db
      .select()
      .from(foodPosts)
      .where(eq(foodPosts.id, id));
    return post;
  }

  async getFoodPosts(options: {
    type?: "donation" | "request";
    userId?: number;
    status?: string;
    category?: string[];
    dietary?: string[];
    search?: string;
    nearLatitude?: number;
    nearLongitude?: number;
    maxDistance?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<FoodPost[]> {
    let query = db.select().from(foodPosts);
    
    // Apply filters
    const conditions = [];
    
    if (options.type) {
      conditions.push(eq(foodPosts.type, options.type));
    }
    
    if (options.userId) {
      conditions.push(eq(foodPosts.userId, options.userId));
    }
    
    if (options.status) {
      conditions.push(eq(foodPosts.status, options.status));
    }
    
    if (options.category && options.category.length > 0) {
      conditions.push(inArray(foodPosts.category, options.category));
    }
    
    if (options.search) {
      const searchTerm = `%${options.search}%`;
      conditions.push(
        or(
          like(foodPosts.title, searchTerm),
          like(foodPosts.description, searchTerm)
        )
      );
    }
    
    // Apply all conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Order by most recent
    query = query.orderBy(desc(foodPosts.createdAt));
    
    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    // Execute query
    return await query;
  }

  async updateFoodPost(id: number, post: Partial<UpdateFoodPost>): Promise<FoodPost | undefined> {
    const [updatedPost] = await db
      .update(foodPosts)
      .set({
        ...post,
        updatedAt: new Date(),
      })
      .where(eq(foodPosts.id, id))
      .returning();
    
    return updatedPost;
  }

  async deleteFoodPost(id: number): Promise<boolean> {
    const result = await db
      .delete(foodPosts)
      .where(eq(foodPosts.id, id));
    
    return true;
  }

  async addFoodPostImage(image: InsertFoodPostImage): Promise<FoodPostImage> {
    const [newImage] = await db
      .insert(foodPostImages)
      .values(image)
      .returning();
    
    return newImage;
  }

  async getFoodPostImages(postId: number): Promise<FoodPostImage[]> {
    return await db
      .select()
      .from(foodPostImages)
      .where(eq(foodPostImages.postId, postId));
  }

  async deleteFoodPostImage(id: number): Promise<boolean> {
    await db
      .delete(foodPostImages)
      .where(eq(foodPostImages.id, id));
    
    return true;
  }
}

// Create and export a singleton instance
export const storage = new DatabaseStorage();
