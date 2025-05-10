import {
  users,
  foodPosts,
  foodPostImages,
  claims,
  ratings,
  notifications,
  messages,
  type User,
  type InsertUser,
  type FoodPost,
  type InsertFoodPost,
  type UpdateFoodPost,
  type FoodPostImage,
  type InsertFoodPostImage,
  type Claim,
  type InsertClaim,
  type UpdateClaim,
  type Rating,
  type InsertRating,
  type Notification,
  type InsertNotification,
  type Message,
  type InsertMessage,
  postStatuses
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, inArray, desc, gt, lt, gte, lte, like, or, sql, notInArray } from "drizzle-orm";
import { randomBytes } from "crypto";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserReputation(userId: number, rating: number): Promise<User | undefined>;
  
  // Food post operations
  createFoodPost(post: InsertFoodPost): Promise<FoodPost>;
  getFoodPost(id: number): Promise<FoodPost | undefined>;
  getFoodPosts(options?: {
  
  // Food post image operations
  addFoodPostImage(image: InsertFoodPostImage): Promise<FoodPostImage>;
  getFoodPostImages(postId: number): Promise<FoodPostImage[]>;
  deleteFoodPostImage(id: number): Promise<boolean>;
    type?: "donation" | "request";
    userId?: number;
    status?: string;
    category?: string[];
    dietary?: string[];
    search?: string;
    nearLatitude?: number;
    nearLongitude?: number;
    maxDistance?: number;
    expiryWithin?: number;
    limit?: number;
    offset?: number;
  }): Promise<FoodPost[]>;
  updateFoodPost(id: number, post: Partial<UpdateFoodPost>): Promise<FoodPost | undefined>;
  deleteFoodPost(id: number): Promise<boolean>;
  
  // Food post image operations
  addFoodPostImage(image: InsertFoodPostImage): Promise<FoodPostImage>;
  getFoodPostImages(postId: number): Promise<FoodPostImage[]>;
  deleteFoodPostImage(id: number): Promise<boolean>;
  
  // Claim operations
  createClaim(claim: InsertClaim): Promise<Claim>;
  getClaim(id: number): Promise<Claim | undefined>;
  getClaims(options?: {
    postId?: number;
    claimerId?: number;
    status?: "completed" | "cancelled" | "pending" | "approved" | "rejected";
    limit?: number;
    offset?: number;
  }): Promise<Claim[]>;
  updateClaim(id: number, claim: Partial<UpdateClaim>): Promise<Claim | undefined>;
  deleteClaim(id: number): Promise<boolean>;
  generateHandoverCode(claimId: number): Promise<string>;
  verifyHandoverCode(claimId: number, code: string): Promise<boolean>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  updateRating(id: number, data: Partial<InsertRating>): Promise<Rating>;
  getRating(id: number): Promise<Rating | undefined>;
  getRatingsByClaimId(claimId: number): Promise<Rating[]>;
  getRatingsByUserId(userId: number): Promise<Rating[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: number, options?: {
    isRead?: boolean;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(claimId: number): Promise<Message[]>;
  getUnreadMessageCount(userId: number): Promise<number>;
  markMessageAsRead(id: number): Promise<boolean>;
  
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
    // Add default value for expiryTime if not provided
    const dayAfterTomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000); // Add 48 hours
    
    // Ensure expiryTime is a proper Date object
    let expiryTime = dayAfterTomorrow;
    if (post.expiryTime) {
      // Handle both Date objects and ISO strings
      expiryTime = typeof post.expiryTime === 'string' 
        ? new Date(post.expiryTime) 
        : post.expiryTime;
    }
    
    const postWithDefaults = {
      ...post,
      expiryTime: expiryTime
    };
    
    console.log('Creating food post with data:', JSON.stringify(postWithDefaults, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));
    
    try {
      const [newPost] = await db
        .insert(foodPosts)
        .values(postWithDefaults)
        .returning();
      return newPost;
    } catch (error) {
      console.error('Error creating food post:', error);
      throw error;
    }
  }

  async getFoodPost(id: number): Promise<FoodPost | undefined> {
    await this.expirePosts();
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
    expiryWithin?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<FoodPost[]> {
    await this.expirePosts();
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
    
    // Add expiryWithin filter
    if (options.expiryWithin) {
      const now = new Date();
      const expiryLimit = new Date(now.getTime() + options.expiryWithin * 24 * 60 * 60 * 1000);
      conditions.push(
        and(
          gte(foodPosts.expiryTime, now),
          lte(foodPosts.expiryTime, expiryLimit)
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
    console.log('Adding food post image:', JSON.stringify(image));
    try {
      const [newImage] = await db
        .insert(foodPostImages)
        .values(image)
        .returning();
      return newImage;
    } catch (error) {
      console.error('Error adding food post image:', error);
      throw error;
    }
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

  // User reputation operations
  async updateUserReputation(userId: number, rating: number): Promise<User | undefined> {
    // Get current user data
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Calculate new average rating
    const newRatingCount = user.ratingCount + 1;
    const newAverageRating = ((user.averageRating || 0) * user.ratingCount + rating) / newRatingCount;
    
    // Check if user should be trusted (5+ ratings with avg >= 4.0)
    const isTrusted = newRatingCount >= 5 && newAverageRating >= 4.0;
    
    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        averageRating: newAverageRating,
        ratingCount: newRatingCount,
        isTrusted: isTrusted
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  // Claim operations
  async createClaim(claim: InsertClaim): Promise<Claim> {
    // Create the claim
    const [newClaim] = await db
      .insert(claims)
      .values(claim)
      .returning();
    
    // Update the post status to "claimed"
    await this.updateFoodPost(claim.postId, { status: "claimed" });
    
    // Create notification for post owner
    const post = await this.getFoodPost(claim.postId);
    if (post) {
      await this.createNotification({
        userId: post.userId,
        type: "claim",
        title: "New claim on your post",
        message: `Someone has claimed your food post "${post.title}"`,
        relatedId: newClaim.id,
        relatedType: "claim"
      });
    }
    
    return newClaim;
  }

  async getClaim(id: number): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.id, id));
    return claim;
  }

  async getClaims(options: {
    postId?: number;
    claimerId?: number;
    status?: "completed" | "cancelled" | "pending" | "approved" | "rejected";
    limit?: number;
    offset?: number;
  } = {}): Promise<Claim[]> {
    let query = db.select().from(claims);
    
    // Apply filters
    const conditions = [];
    
    if (options.postId) {
      conditions.push(eq(claims.postId, options.postId));
    }
    
    if (options.claimerId) {
      conditions.push(eq(claims.claimerId, options.claimerId));
    }
    
    if (options.status) {
      conditions.push(eq(claims.status, options.status));
    }
    
    // Apply all conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Order by creation date, newest first
    query = query.orderBy(desc(claims.createdAt));
    
    // Pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    // Execute the query
    const claimsList = await query;
    return claimsList;
  }

  async updateClaim(id: number, updateData: Partial<UpdateClaim>): Promise<Claim | undefined> {
    // Get current claim
    const currentClaim = await this.getClaim(id);
    if (!currentClaim) return undefined;
    
    // Set updatedAt to current timestamp
    updateData.updatedAt = new Date();
    
    // Update the claim
    const [updatedClaim] = await db
      .update(claims)
      .set(updateData)
      .where(eq(claims.id, id))
      .returning();
    
    // If status changed, create notifications and update post status
    if (updateData.status && updateData.status !== currentClaim.status) {
      const post = await this.getFoodPost(currentClaim.postId);
      const claimer = await this.getUser(currentClaim.claimerId);
      
      if (post && claimer) {
        // Update post status based on claim status
        let postStatus: string | undefined;
        
        switch (updateData.status) {
          case "approved":
            postStatus = "claimed";
            
            // Notify claimer
            await this.createNotification({
              userId: claimer.id,
              type: "claim",
              title: "Claim approved",
              message: `Your claim for "${post.title}" has been approved. You can now arrange pickup.`,
              relatedId: id,
              relatedType: "claim"
            });
            break;
            
          case "rejected":
            postStatus = "available";
            
            // Notify claimer
            await this.createNotification({
              userId: claimer.id,
              type: "claim",
              title: "Claim rejected",
              message: `Your claim for "${post.title}" has been rejected.`,
              relatedId: id,
              relatedType: "claim"
            });
            break;
            
          case "in_progress":
            postStatus = "in_progress";
            break;
            
          case "completed":
            postStatus = "completed";
            
            // Update user stats
            if (post.type === "donation") {
              // For donations: poster is donating, claimer is receiving
              await db.update(users)
                .set({ donationCount: sql`donation_count + 1` })
                .where(eq(users.id, post.userId));
              
              await db.update(users)
                .set({ receivedCount: sql`received_count + 1` })
                .where(eq(users.id, claimer.id));
            } else {
              // For requests: poster is receiving, claimer is donating
              await db.update(users)
                .set({ receivedCount: sql`received_count + 1` })
                .where(eq(users.id, post.userId));
              
              await db.update(users)
                .set({ donationCount: sql`donation_count + 1` })
                .where(eq(users.id, claimer.id));
            }
            
            // Notify both parties
            await this.createNotification({
              userId: post.userId,
              type: "claim",
              title: "Exchange completed",
              message: "The food exchange has been completed. Please rate your experience.",
              relatedId: id,
              relatedType: "claim"
            });
            
            await this.createNotification({
              userId: claimer.id,
              type: "claim",
              title: "Exchange completed",
              message: "The food exchange has been completed. Please rate your experience.",
              relatedId: id,
              relatedType: "claim"
            });
            break;
            
          case "cancelled":
            postStatus = "available";
            
            // Notify post owner if they didn't cancel it themselves
            await this.createNotification({
              userId: post.userId,
              type: "claim",
              title: "Claim cancelled",
              message: `The claim for "${post.title}" has been cancelled.`,
              relatedId: id,
              relatedType: "claim"
            });
            break;
        }
        
        // Update post status if needed
        if (postStatus) {
          await this.updateFoodPost(post.id, { status: postStatus });
        }
      }
    }
    
    return updatedClaim;
  }

  async deleteClaim(id: number): Promise<boolean> {
    // Get the claim first to update the post status
    const claim = await this.getClaim(id);
    if (!claim) return false;
    
    // Only delete if claim is pending or rejected
    if (claim.status !== "pending" && claim.status !== "rejected") {
      return false;
    }
    
    // If this was the only claim, set post back to available
    const otherActiveClaims = await this.getClaims({
      postId: claim.postId,
      status: "approved"
    });
    
    if (otherActiveClaims.length === 0) {
      await this.updateFoodPost(claim.postId, { status: "available" });
    }
    
    // Delete the claim
    const result = await db.delete(claims).where(eq(claims.id, id));
    return result.count > 0;
  }

  async generateHandoverCode(claimId: number): Promise<string> {
    // Generate a random 6-digit code
    const code = randomBytes(3).toString('hex').toUpperCase().substring(0, 6);
    
    // Save the code to the claim
    await db
      .update(claims)
      .set({ handoverCode: code })
      .where(eq(claims.id, claimId));
    
    return code;
  }

  async verifyHandoverCode(claimId: number, code: string): Promise<boolean> {
    // Get the claim
    const claim = await this.getClaim(claimId);
    if (!claim || !claim.handoverCode) return false;
    
    // Verify the code
    const isValid = claim.handoverCode === code;
    
    // If valid, mark as verified and update status
    if (isValid) {
      await db
        .update(claims)
        .set({ 
          isHandoverVerified: true,
          status: "completed",
          updatedAt: new Date()
        })
        .where(eq(claims.id, claimId));
      
      // Update post status to completed
      const post = await this.getFoodPost(claim.postId);
      if (post) {
        await this.updateFoodPost(post.id, { status: "completed" });
      }
    }
    
    return isValid;
  }

  // Rating operations
  async createRating(rating: InsertRating): Promise<Rating> {
    // Create the rating
    const [newRating] = await db.insert(ratings).values(rating).returning();
    
    // Update user reputation
    await this.updateUserReputation(rating.toUserId, rating.rating);
    
    // Create notification for rated user
    await this.createNotification({
      userId: rating.toUserId,
      type: "rating",
      title: "New rating received",
      message: `You received a ${rating.rating}-star rating for a food exchange`,
      relatedId: newRating.id,
      relatedType: "rating"
    });
    
    return newRating;
  }
  
  async updateRating(id: number, data: Partial<InsertRating>): Promise<Rating> {
    // Get the original rating to calculate reputation adjustment
    const originalRating = await this.getRating(id);
    
    if (!originalRating) {
      throw new Error(`Rating with ID ${id} not found`);
    }
    
    // Update the rating
    const [updatedRating] = await db
      .update(ratings)
      .set(data)
      .where(eq(ratings.id, id))
      .returning();
    
    // If the rating value changed, update user reputation
    if (data.rating && data.rating !== originalRating.rating) {
      // Remove the effect of the old rating
      await this.updateUserReputation(originalRating.toUserId, -originalRating.rating);
      
      // Add the effect of the new rating
      await this.updateUserReputation(originalRating.toUserId, data.rating);
      
      // Create notification for updated rating
      await this.createNotification({
        userId: originalRating.toUserId,
        type: "rating_update",
        title: "Rating updated",
        message: `Your rating was updated to ${data.rating} stars`,
        relatedId: updatedRating.id,
        relatedType: "rating"
      });
    }
    
    return updatedRating;
  }

  async getRating(id: number): Promise<Rating | undefined> {
    const [rating] = await db.select().from(ratings).where(eq(ratings.id, id));
    return rating;
  }

  async getRatingsByClaimId(claimId: number): Promise<Rating[]> {
    return db.select().from(ratings).where(eq(ratings.claimId, claimId));
  }

  async getRatingsByUserId(userId: number): Promise<Rating[]> {
    return db.select().from(ratings).where(eq(ratings.toUserId, userId));
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getNotifications(userId: number, options: {
    isRead?: boolean;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Notification[]> {
    let query = db.select().from(notifications).where(eq(notifications.userId, userId));
    
    // Apply filters
    if (options.isRead !== undefined) {
      query = query.where(eq(notifications.isRead, options.isRead));
    }
    
    if (options.type) {
      query = query.where(eq(notifications.type, options.type));
    }
    
    // Order by creation date, newest first
    query = query.orderBy(desc(notifications.createdAt));
    
    // Pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    // Execute the query
    const notificationsList = await query;
    return notificationsList;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
      
    return result.count > 0;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
      
    return result.count > 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return result.count > 0;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    
    // Create notification for receiver
    await this.createNotification({
      userId: message.receiverId,
      type: "message",
      title: "New message",
      message: `You have a new message regarding a food exchange`,
      relatedId: newMessage.id,
      relatedType: "message"
    });
    
    return newMessage;
  }

  async getMessages(claimId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.claimId, claimId))
      .orderBy(messages.createdAt);
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      ));
      
    return result[0]?.count || 0;
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
      
    return result.count > 0;
  }

  // Send near-expiry notifications for posts expiring in 1 day
  async sendNearExpiryNotifications() {
    // Find posts expiring in 24-25 hours
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const posts = await db.select().from(foodPosts)
      .where(and(
        gte(foodPosts.expiryTime, in24h),
        lte(foodPosts.expiryTime, in25h)
      ));
    for (const post of posts) {
      // Find active claim (pending/claimed/approved)
      const claims = await this.getClaims({ postId: post.id });
      const activeClaim = claims.find(c => ["pending", "claimed", "approved"].includes(c.status));
      if (activeClaim) {
        await this.createNotification({
          userId: activeClaim.claimerId,
          type: "expiry_warning",
          title: "Request expiring soon",
          message: "Your request expires in 1 day.",
          relatedId: post.id,
          relatedType: "post"
        });
      }
    }
  }

  // Expire posts whose expiryTime has passed
  async expirePosts() {
    const now = new Date();
    await db.update(foodPosts)
      .set({ status: "expired" })
      .where(and(
        lt(foodPosts.expiryTime, now),
        notInArray(foodPosts.status, [postStatuses[3], postStatuses[4]]) // "completed", "expired"
      ));
  }
}

// Create and export a singleton instance
export const storage = new DatabaseStorage();
