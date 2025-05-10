import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema for database
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  zipCode: text("zip_code"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  // Reputation fields
  donationCount: integer("donation_count").default(0).notNull(),
  receivedCount: integer("received_count").default(0).notNull(),
  averageRating: real("average_rating").default(0),
  ratingCount: integer("rating_count").default(0).notNull(),
  isTrusted: boolean("is_trusted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema for inserting a new user
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define food post types
export const foodPostTypes = ["donation", "request"] as const;
export type FoodPostType = typeof foodPostTypes[number];

// Define food categories
export const foodCategories = ["meal", "groceries", "produce", "baked_goods", "other"] as const;
export type FoodCategory = typeof foodCategories[number];

// Define dietary information options
export const dietaryOptions = ["vegetarian", "vegan", "gluten_free", "contains_nuts", "dairy_free"] as const;
export type DietaryOption = typeof dietaryOptions[number];

// Define post statuses
export const postStatuses = ["available", "claimed", "in_progress", "completed", "expired", "cancelled"] as const;
export type PostStatus = typeof postStatuses[number];

// Define claim statuses
export const claimStatuses = ["pending", "approved", "rejected", "cancelled", "completed"] as const;
export type ClaimStatus = typeof claimStatuses[number];

// Food Posts schema
export const foodPosts = pgTable("food_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type", { enum: foodPostTypes }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  quantity: text("quantity").notNull(),
  category: text("category", { enum: foodCategories }).notNull(),
  dietary: json("dietary").$type<DietaryOption[]>().default([]),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  // Removed pickupStartTime and pickupEndTime fields
  expiryTime: timestamp("expiry_time").notNull(),
  status: text("status", { enum: postStatuses }).default("available").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Food post images schema
export const foodPostImages = pgTable("food_post_images", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => foodPosts.id).notNull(),
  imageUrl: text("image_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Claims schema
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => foodPosts.id).notNull(),
  claimerId: integer("claimer_id").references(() => users.id).notNull(),
  status: text("status", { enum: claimStatuses }).default("pending").notNull(),
  pickupTime: timestamp("pickup_time"),
  message: text("message"),
  contactPreference: text("contact_preference").default("in_app"),
  handoverCode: text("handover_code"),
  isHandoverVerified: boolean("is_handover_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ratings schema
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").references(() => claims.id).notNull(),
  fromUserId: integer("from_user_id").references(() => users.id).notNull(),
  toUserId: integer("to_user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  categories: json("categories").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // claim, message, reminder, system
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: integer("related_id"), // ID of related claim, post, etc.
  relatedType: text("related_type"), // "claim", "post", etc.
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages schema for in-app messaging
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").references(() => claims.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations between tables
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(foodPosts),
  claimsAsClaimer: many(claims, { relationName: "claimer" }),
  ratingsSent: many(ratings, { relationName: "ratingsSent" }),
  ratingsReceived: many(ratings, { relationName: "ratingsReceived" }),
  notifications: many(notifications),
  messagesSent: many(messages, { relationName: "sender" }),
  messagesReceived: many(messages, { relationName: "receiver" }),
}));

export const foodPostsRelations = relations(foodPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [foodPosts.userId],
    references: [users.id],
  }),
  images: many(foodPostImages),
  claims: many(claims),
}));

export const foodPostImagesRelations = relations(foodPostImages, ({ one }) => ({
  post: one(foodPosts, {
    fields: [foodPostImages.postId],
    references: [foodPosts.id],
  }),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  post: one(foodPosts, {
    fields: [claims.postId],
    references: [foodPosts.id],
  }),
  claimer: one(users, {
    fields: [claims.claimerId],
    references: [users.id],
    relationName: "claimer",
  }),
  rating: many(ratings),
  messages: many(messages),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  claim: one(claims, {
    fields: [ratings.claimId],
    references: [claims.id],
  }),
  fromUser: one(users, {
    fields: [ratings.fromUserId],
    references: [users.id],
    relationName: "ratingsSent",
  }),
  toUser: one(users, {
    fields: [ratings.toUserId],
    references: [users.id],
    relationName: "ratingsReceived",
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  claim: one(claims, {
    fields: [messages.claimId],
    references: [claims.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

// Schema for inserting a new food post
export const insertFoodPostSchema = createInsertSchema(foodPosts).omit({
  id: true,
  userId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  expiryTime: true,
}).extend({
  status: z.string().optional(),
  type: z.string().optional(),
  latitude: z.number({ required_error: "Latitude is required" }),
  longitude: z.number({ required_error: "Longitude is required" }),
  expiryTime: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format for expiryTime');
        }
        return date;
      }
      return val;
    },
    z.date({
      required_error: "Expiry date is required",
      invalid_type_error: "Expiry date must be a valid date"
    }).optional().default(() => new Date(Date.now() + 172800000))
  ),
});

// Schema for updating a food post
export const updateFoodPostSchema = createInsertSchema(foodPosts).omit({
  id: true,
  userId: true,
  createdAt: true,
});

// Schema for inserting a new food post image
export const insertFoodPostImageSchema = createInsertSchema(foodPostImages).omit({
  id: true,
  uploadedAt: true,
});

// Schema for creating a new claim
export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  status: true,
  handoverCode: true,
  isHandoverVerified: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for updating a claim
export const updateClaimSchema = createInsertSchema(claims).omit({
  id: true,
  postId: true,
  claimerId: true,
  createdAt: true,
});

// Schema for creating a new rating
export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

// Schema for creating a new notification
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

// Schema for creating a new message
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

// Export types
export type InsertFoodPost = z.infer<typeof insertFoodPostSchema>;
export type UpdateFoodPost = z.infer<typeof updateFoodPostSchema>;
export type FoodPost = typeof foodPosts.$inferSelect;
export type InsertFoodPostImage = z.infer<typeof insertFoodPostImageSchema>;
export type FoodPostImage = typeof foodPostImages.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type UpdateClaim = z.infer<typeof updateClaimSchema>;
export type Claim = typeof claims.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
