import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json } from "drizzle-orm/pg-core";
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
export const postStatuses = ["available", "claimed", "completed", "expired"] as const;
export type PostStatus = typeof postStatuses[number];

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
  address: text("address").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  pickupStartTime: timestamp("pickup_start_time").notNull(),
  pickupEndTime: timestamp("pickup_end_time").notNull(),
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

// Define relations between tables
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(foodPosts),
}));

export const foodPostsRelations = relations(foodPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [foodPosts.userId],
    references: [users.id],
  }),
  images: many(foodPostImages),
}));

export const foodPostImagesRelations = relations(foodPostImages, ({ one }) => ({
  post: one(foodPosts, {
    fields: [foodPostImages.postId],
    references: [foodPosts.id],
  }),
}));

// Schema for inserting a new food post
export const insertFoodPostSchema = createInsertSchema(foodPosts).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
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

export type InsertFoodPost = z.infer<typeof insertFoodPostSchema>;
export type UpdateFoodPost = z.infer<typeof updateFoodPostSchema>;
export type FoodPost = typeof foodPosts.$inferSelect;
export type InsertFoodPostImage = z.infer<typeof insertFoodPostImageSchema>;
export type FoodPostImage = typeof foodPostImages.$inferSelect;
