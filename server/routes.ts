import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertFoodPostSchema, 
  updateFoodPostSchema, 
  insertFoodPostImageSchema,
  insertClaimSchema,
  updateClaimSchema,
  insertRatingSchema,
  insertMessageSchema,
  foodPostTypes,
  foodCategories,
  dietaryOptions,
  postStatuses,
  claimStatuses
} from "@shared/schema";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "You must be logged in to perform this action" });
  }
  next();
};

// Middleware to validate request body against a schema
const validateBody = (schema: z.ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      next(error);
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get enum values for clients
  app.get("/api/enums", (_req, res) => {
    res.json({
      foodPostTypes,
      foodCategories,
      dietaryOptions,
      postStatuses
    });
  });

  // Food Posts API Routes
  // Create a food post
  app.post(
    "/api/posts", 
    isAuthenticated,
    validateBody(insertFoodPostSchema),
    async (req, res, next) => {
      try {
        const userId = req.user!.id;
        const post = await storage.createFoodPost({
          ...req.body,
          userId
        });
        
        res.status(201).json(post);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get all food posts with filtering
  app.get("/api/posts", async (req, res, next) => {
    try {
      const {
        type,
        userId,
        status,
        category,
        search,
        latitude,
        longitude,
        distance,
        limit,
        offset
      } = req.query;

      const options: any = {};

      if (type) options.type = type as "donation" | "request";
      if (userId) options.userId = Number(userId);
      if (status) options.status = status as string;
      if (category) options.category = Array.isArray(category) ? category as string[] : [category as string];
      if (search) options.search = search as string;
      if (latitude && longitude) {
        options.nearLatitude = Number(latitude);
        options.nearLongitude = Number(longitude);
      }
      if (distance) options.maxDistance = Number(distance);
      if (limit) options.limit = Number(limit);
      if (offset) options.offset = Number(offset);

      const posts = await storage.getFoodPosts(options);
      
      res.json(posts);
    } catch (error) {
      next(error);
    }
  });

  // Get a specific food post
  app.get("/api/posts/:id", async (req, res, next) => {
    try {
      const post = await storage.getFoodPost(Number(req.params.id));
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      next(error);
    }
  });

  // Update a food post
  app.patch(
    "/api/posts/:id",
    isAuthenticated,
    validateBody(updateFoodPostSchema.partial()),
    async (req, res, next) => {
      try {
        const postId = Number(req.params.id);
        const post = await storage.getFoodPost(postId);
        
        if (!post) {
          return res.status(404).json({ error: "Post not found" });
        }
        
        // Check if the user is the owner of the post
        if (post.userId !== req.user!.id) {
          return res.status(403).json({ error: "You can only update your own posts" });
        }
        
        const updatedPost = await storage.updateFoodPost(postId, req.body);
        res.json(updatedPost);
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete a food post
  app.delete("/api/posts/:id", isAuthenticated, async (req, res, next) => {
    try {
      const postId = Number(req.params.id);
      const post = await storage.getFoodPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Check if the user is the owner of the post
      if (post.userId !== req.user!.id) {
        return res.status(403).json({ error: "You can only delete your own posts" });
      }
      
      await storage.deleteFoodPost(postId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Food Post Images API Routes
  // Add an image to a food post
  app.post(
    "/api/posts/:id/images",
    isAuthenticated,
    validateBody(insertFoodPostImageSchema),
    async (req, res, next) => {
      try {
        const postId = Number(req.params.id);
        const post = await storage.getFoodPost(postId);
        
        if (!post) {
          return res.status(404).json({ error: "Post not found" });
        }
        
        // Check if the user is the owner of the post
        if (post.userId !== req.user!.id) {
          return res.status(403).json({ error: "You can only add images to your own posts" });
        }
        
        const image = await storage.addFoodPostImage({
          ...req.body,
          postId
        });
        
        res.status(201).json(image);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get all images for a food post
  app.get("/api/posts/:id/images", async (req, res, next) => {
    try {
      const postId = Number(req.params.id);
      const images = await storage.getFoodPostImages(postId);
      
      res.json(images);
    } catch (error) {
      next(error);
    }
  });

  // Delete an image from a food post
  app.delete("/api/posts/:postId/images/:imageId", isAuthenticated, async (req, res, next) => {
    try {
      const postId = Number(req.params.postId);
      const imageId = Number(req.params.imageId);
      
      const post = await storage.getFoodPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Check if the user is the owner of the post
      if (post.userId !== req.user!.id) {
        return res.status(403).json({ error: "You can only delete images from your own posts" });
      }
      
      await storage.deleteFoodPostImage(imageId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
