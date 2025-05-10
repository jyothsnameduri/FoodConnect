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
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

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

// Get current file path and directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Multer setup for food post images
const uploadDir = path.join(__dirname, "..", "uploads", "food-images");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"));
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get enum values for clients
  app.get("/api/enums", (_req, res) => {
    res.json({
      foodPostTypes,
      foodCategories,
      dietaryOptions,
      postStatuses,
      claimStatuses
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
        // Log the request for debugging
        console.log('POST /api/posts request body:', JSON.stringify(req.body));
        console.log('User from session:', req.user);
        
        if (!req.user || !req.user.id) {
          return res.status(401).json({ error: "Authentication required. Please log in again." });
        }
        
        const userId = req.user.id;
        
        // Create a new object with all the required fields
        const postData = {
          ...req.body,
          userId
        };
        
        // Log the data being sent to storage
        console.log('Creating post with data:', JSON.stringify(postData, (key, value) => {
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        }));
        
        const post = await storage.createFoodPost(postData);
        
        // Log success
        console.log('Post created successfully:', post.id);
        
        res.status(201).json(post);
      } catch (error) {
        console.error('Error creating post:', error);
        
        // Provide more detailed error information
        if (error instanceof Error) {
          res.status(400).json({ error: error.message });
        } else {
          next(error);
        }
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
        expiryWithin,
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
      if (expiryWithin) options.expiryWithin = Number(expiryWithin);
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
    upload.single("image"),
    async (req, res, next) => {
      try {
        const postId = Number(req.params.id);
        const post = await storage.getFoodPost(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });
        if (post.userId !== req.user!.id) return res.status(403).json({ error: "You can only add images to your own posts" });
        // Type assertion for multer file
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) return res.status(400).json({ error: "No image file uploaded" });
        // Save the image info in the DB
        const image = await storage.addFoodPostImage({
          postId,
          imageUrl: `/uploads/food-images/${file.filename}`
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

  // Claim routes
  // Create a claim for a food post
  app.post(
    "/api/posts/:id/claim",
    isAuthenticated,
    validateBody(insertClaimSchema),
    async (req, res, next) => {
      try {
        const postId = Number(req.params.id);
        const post = await storage.getFoodPost(postId);
        
        if (!post) {
          return res.status(404).json({ error: "Post not found" });
        }
        
        // Check if post is available
        if (post.status !== "available") {
          return res.status(400).json({ error: "This post is not available for claiming" });
        }
        
        // Check if user is not the post owner
        if (post.userId === req.user!.id) {
          return res.status(400).json({ error: "You cannot claim your own post" });
        }
        
        // Create the claim
        const claim = await storage.createClaim({
          ...req.body,
          postId,
          claimerId: req.user!.id
        });
        
        res.status(201).json(claim);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Get all claims for a user
  app.get("/api/claims", isAuthenticated, async (req, res, next) => {
    try {
      const { status, limit, offset } = req.query;
      
      const options: any = {
        claimerId: req.user!.id
      };
      
      if (status) options.status = status;
      if (limit) options.limit = Number(limit);
      if (offset) options.offset = Number(offset);
      
      const claims = await storage.getClaims(options);
      res.json(claims);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new claim
  app.post("/api/claims", isAuthenticated, validateBody(insertClaimSchema), async (req, res, next) => {
    try {
      const { postId, message, contactPreference } = req.body;
      // Verify the post exists
      const post = await storage.getFoodPost(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      // Only allow if post is available
      if (post.status !== "available") return res.status(400).json({ error: "This post is no longer available" });
      // Prevent self-claim
      const allClaims = await storage.getClaims({ postId });
      const existing = allClaims.filter((c: any) => c.status === "pending" || c.status === "approved");
      if (existing.length > 0) return res.status(400).json({ error: "Already claimed or pending" });
      // Create claim
      const claim = await storage.createClaim({
        postId,
        claimerId: req.user!.id,
        message,
        contactPreference: contactPreference || "in_app"
      });
      // Notify post owner
      await storage.createNotification({
        userId: post.userId,
        type: "claim_request",
        title: "New response to your request",
        message: `${req.user!.username} responded to your request: ${post.title}`,
        relatedId: claim.id,
        relatedType: "claim"
      });
      res.status(201).json(claim);
    } catch (error) { next(error); }
  });
  
  // Get all claims for a post
  app.get("/api/posts/:id/claims", isAuthenticated, async (req, res, next) => {
    try {
      const postId = Number(req.params.id);
      const post = await storage.getFoodPost(postId);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Only the post owner can see all claims
      if (post.userId !== req.user!.id) {
        return res.status(403).json({ error: "You can only view claims for your own posts" });
      }
      
      const claims = await storage.getClaims({ postId });
      res.json(claims);
    } catch (error) {
      next(error);
    }
  });
  
  // Get a claim by ID
  app.get("/api/claims/:id", isAuthenticated, async (req, res, next) => {
    try {
      const claimId = Number(req.params.id);
      const claim = await storage.getClaim(claimId);
      
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      // Get post to check ownership
      const post = await storage.getFoodPost(claim.postId);
      
      if (!post) {
        return res.status(404).json({ error: "Associated post not found" });
      }
      
      // Only the post owner or the claimer can view the claim
      if (post.userId !== req.user!.id && claim.claimerId !== req.user!.id) {
        return res.status(403).json({ 
          error: "You don't have permission to view this claim" 
        });
      }
      
      res.json(claim);
    } catch (error) {
      next(error);
    }
  });
  
  // Update a claim
  app.patch(
    "/api/claims/:id",
    isAuthenticated,
    validateBody(updateClaimSchema.partial()),
    async (req, res, next) => {
      try {
        const claimId = Number(req.params.id);
        const claim = await storage.getClaim(claimId);
        if (!claim) return res.status(404).json({ error: "Claim not found" });
        const post = await storage.getFoodPost(claim.postId);
        if (!post) return res.status(404).json({ error: "Associated post not found" });
        // Accept claim
        if (req.body.status === "approved" && req.user!.id === post.userId) {
          await storage.updateClaim(claimId, { status: "approved" });
          await storage.updateFoodPost(post.id, { status: "claimed" });
          // Reject other pending claims
          const pendingClaims = await storage.getClaims({ postId: post.id, status: "pending" });
          for (const other of pendingClaims) {
            if (other.id !== claimId) await storage.updateClaim(other.id, { status: "rejected" });
          }
          // Notify claimer
          await storage.createNotification({
            userId: claim.claimerId,
            type: "claim_accepted",
            title: "Your response was accepted",
            message: `Your response to \"${post.title}\" was accepted.`,
            relatedId: claimId,
            relatedType: "claim"
          });
          return res.json({ success: true });
        }
        // Mark as completed
        if (req.body.status === "completed" && (req.user!.id === post.userId || req.user!.id === claim.claimerId)) {
          await storage.updateClaim(claimId, { status: "completed" });
          await storage.updateFoodPost(post.id, { status: "completed" });
          // Notify both users
          await storage.createNotification({
            userId: post.userId,
            type: "claim_completed",
            title: "Pickup completed",
            message: `The pickup for \"${post.title}\" is marked as completed.`,
            relatedId: claimId,
            relatedType: "claim"
          });
          await storage.createNotification({
            userId: claim.claimerId,
            type: "claim_completed",
            title: "Pickup completed",
            message: `The pickup for \"${post.title}\" is marked as completed.`,
            relatedId: claimId,
            relatedType: "claim"
          });
          return res.json({ success: true });
        }
        // Default: fallback to original logic
        // Check permissions based on the update being performed
        if (req.body.status) {
          if (post.userId === req.user!.id) {
            if (
              req.body.status !== "approved" && 
              req.body.status !== "rejected" && 
              req.body.status !== "completed"
            ) {
              return res.status(403).json({ 
                error: "Post owners can only approve, reject, or complete claims" 
              });
            }
          } else if (claim.claimerId === req.user!.id) {
            if (
              req.body.status !== "cancelled" && 
              req.body.status !== "in_progress" && 
              req.body.status !== "completed"
            ) {
              return res.status(403).json({ 
                error: "Claimers can only cancel, mark as in-progress, or complete claims" 
              });
            }
          } else {
            return res.status(403).json({ 
              error: "You don't have permission to update this claim" 
            });
          }
        } else {
          if (claim.claimerId !== req.user!.id) {
            return res.status(403).json({ 
              error: "You can only update your own claims" 
            });
          }
        }
        const updatedClaim = await storage.updateClaim(claimId, req.body);
        res.json(updatedClaim);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Delete a claim
  app.delete("/api/claims/:id", isAuthenticated, async (req, res, next) => {
    try {
      const claimId = Number(req.params.id);
      const claim = await storage.getClaim(claimId);
      
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      // Only the claimer can delete their claim
      if (claim.claimerId !== req.user!.id) {
        return res.status(403).json({ error: "You can only delete your own claims" });
      }
      
      // Only delete pending or rejected claims
      if (claim.status !== "pending" && claim.status !== "rejected") {
        return res.status(400).json({ error: "Only pending or rejected claims can be deleted" });
      }
      
      await storage.deleteClaim(claimId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Generate handover code
  app.post("/api/claims/:id/handover-code", isAuthenticated, async (req, res, next) => {
    try {
      const claimId = Number(req.params.id);
      const claim = await storage.getClaim(claimId);
      
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      const post = await storage.getFoodPost(claim.postId);
      
      if (!post) {
        return res.status(404).json({ error: "Associated post not found" });
      }
      
      // Only the post owner can generate codes
      if (post.userId !== req.user!.id) {
        return res.status(403).json({ error: "Only the post owner can generate handover codes" });
      }
      
      // Only generate for approved claims
      if (claim.status !== "approved") {
        return res.status(400).json({ 
          error: "Handover codes can only be generated for approved claims" 
        });
      }
      
      const code = await storage.generateHandoverCode(claimId);
      res.json({ code });
    } catch (error) {
      next(error);
    }
  });
  
  // Verify handover code
  app.post("/api/claims/:id/verify-handover", isAuthenticated, async (req, res, next) => {
    try {
      const claimId = Number(req.params.id);
      const claim = await storage.getClaim(claimId);
      
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      // Only the claimer can verify codes
      if (claim.claimerId !== req.user!.id) {
        return res.status(403).json({ error: "Only the claimer can verify handover codes" });
      }
      
      // Validate the code
      const schema = z.object({
        code: z.string()
      });
      
      try {
        req.body = schema.parse(req.body);
      } catch (error) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      
      const isValid = await storage.verifyHandoverCode(claimId, req.body.code);
      
      if (isValid) {
        res.json({ success: true, message: "Handover verified successfully" });
      } else {
        res.status(400).json({ error: "Invalid handover code" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Rating routes
  // Rate a claim
  app.post(
    "/api/claims/:id/rate",
    isAuthenticated,
    async (req, res, next) => {
      try {
        console.log('Rating submission received:', req.body);
        
        // Extract and validate required fields
        const { rating, comment, categories, claimId: bodyClaimId, fromUserId: bodyFromUserId, toUserId } = req.body;
        
        // Use the claim ID from the URL parameter or body
        const claimId = Number(req.params.id || bodyClaimId);
        
        if (isNaN(claimId)) {
          return res.status(400).json({ error: "Invalid claim ID" });
        }
        
        console.log(`Processing rating for claim ID: ${claimId}, rating value: ${rating}`);
        
        const claim = await storage.getClaim(claimId);
        
        if (!claim) {
          return res.status(404).json({ error: "Claim not found" });
        }
        
        const post = await storage.getFoodPost(claim.postId);
        
        if (!post) {
          return res.status(404).json({ error: "Associated post not found" });
        }
        
        // Verify that claim is completed
        if (claim.status !== "completed") {
          return res.status(400).json({ error: "Only completed claims can be rated" });
        }
        
        // Use the authenticated user's ID
        const fromUserId = req.user!.id;
        
        // If toUserId is provided in the request, use it, otherwise determine it
        let finalToUserId: number;
        
        if (toUserId) {
          finalToUserId = Number(toUserId);
          
          // Verify the toUserId is valid for this claim
          if (finalToUserId !== post.userId && finalToUserId !== claim.claimerId) {
            return res.status(400).json({ error: "Invalid recipient for rating" });
          }
        } else {
          // Determine the recipient of the rating
          if (fromUserId === post.userId) {
            // Post owner rating the claimer
            finalToUserId = claim.claimerId;
          } else if (fromUserId === claim.claimerId) {
            // Claimer rating the post owner
            finalToUserId = post.userId;
          } else {
            return res.status(403).json({ error: "You don't have permission to rate this claim" });
          }
        }
        
        // Check if already rated
        const existingRatings = await storage.getRatingsByClaimId(claimId);
        const alreadyRated = existingRatings.some(r => r.fromUserId === fromUserId && r.toUserId === finalToUserId);
        
        if (alreadyRated) {
          // If already rated, update the existing rating instead of creating a new one
          const existingRating = existingRatings.find(r => r.fromUserId === fromUserId && r.toUserId === finalToUserId);
          
          if (existingRating) {
            const updatedRating = await storage.updateRating(existingRating.id, {
              rating: Number(rating),
              comment: comment || "",
              categories: categories || []
            });
            
            return res.status(200).json(updatedRating);
          }
        }
        
        // Validate the rating value
        const ratingValue = Number(rating);
        if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
          return res.status(400).json({ error: "Rating must be a number between 1 and 5" });
        }
        
        // Create the rating with all required fields
        const ratingData = {
          claimId,
          fromUserId,
          toUserId: finalToUserId,
          rating: ratingValue,
          comment: comment || "",
          categories: categories || []
        };
        
        console.log('Creating rating with data:', ratingData);
        
        const newRating = await storage.createRating(ratingData);
        
        res.status(201).json(newRating);
      } catch (error) {
        console.error('Error creating rating:', error);
        next(error);
      }
    }
  );
  
  // Get ratings for a claim
  app.get("/api/claims/:id/ratings", async (req, res, next) => {
    try {
      const claimId = Number(req.params.id);
      const ratings = await storage.getRatingsByClaimId(claimId);
      res.json(ratings);
    } catch (error) {
      next(error);
    }
  });
  
  // Get ratings for a user
  app.get("/api/users/:id/ratings", async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      const ratings = await storage.getRatingsByUserId(userId);
      res.json(ratings);
    } catch (error) {
      next(error);
    }
  });
  
  // Notification routes
  // Get notifications for the current user
  app.get("/api/notifications", isAuthenticated, async (req, res, next) => {
    try {
      const options: any = {};
      
      if (req.query.isRead) {
        options.isRead = req.query.isRead === 'true';
      }
      
      if (req.query.type) {
        options.type = req.query.type;
      }
      
      if (req.query.limit) {
        options.limit = Number(req.query.limit);
      }
      
      if (req.query.offset) {
        options.offset = Number(req.query.offset);
      }
      
      const notifications = await storage.getNotifications(req.user!.id, options);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });
  
  // Mark a notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res, next) => {
    try {
      const notificationId = Number(req.params.id);
      
      // TODO: Add check to make sure user owns the notification
      
      const success = await storage.markNotificationAsRead(notificationId);
      res.json({ success });
    } catch (error) {
      next(error);
    }
  });
  
  // Mark all notifications as read
  app.patch("/api/notifications/read-all", isAuthenticated, async (req, res, next) => {
    try {
      const success = await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ success });
    } catch (error) {
      next(error);
    }
  });
  
  // Delete a notification
  app.delete("/api/notifications/:id", isAuthenticated, async (req, res, next) => {
    try {
      const notificationId = Number(req.params.id);
      
      // TODO: Add check to make sure user owns the notification
      
      const success = await storage.deleteNotification(notificationId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ error: "Notification not found" });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Message routes
  // Get messages for a claim
  app.get("/api/claims/:id/messages", isAuthenticated, async (req, res, next) => {
    try {
      const claimId = Number(req.params.id);
      const claim = await storage.getClaim(claimId);
      
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      const post = await storage.getFoodPost(claim.postId);
      
      if (!post) {
        return res.status(404).json({ error: "Associated post not found" });
      }
      
      // Only allow post owner or claimer to view messages
      if (post.userId !== req.user!.id && claim.claimerId !== req.user!.id) {
        return res.status(403).json({ error: "You don't have permission to view these messages" });
      }
      
      const messages = await storage.getMessages(claimId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });
  
  // Send a message
  app.post(
    "/api/claims/:id/messages",
    isAuthenticated,
    validateBody(insertMessageSchema),
    async (req, res, next) => {
      try {
        const claimId = Number(req.params.id);
        const claim = await storage.getClaim(claimId);
        
        if (!claim) {
          return res.status(404).json({ error: "Claim not found" });
        }
        
        const post = await storage.getFoodPost(claim.postId);
        
        if (!post) {
          return res.status(404).json({ error: "Associated post not found" });
        }
        
        // Only allow post owner or claimer to send messages
        if (post.userId !== req.user!.id && claim.claimerId !== req.user!.id) {
          return res.status(403).json({ error: "You don't have permission to send messages for this claim" });
        }
        
        // Determine recipient
        const senderId = req.user!.id;
        const receiverId = senderId === post.userId ? claim.claimerId : post.userId;
        
        // Create message
        const message = await storage.createMessage({
          ...req.body,
          claimId,
          senderId,
          receiverId
        });
        
        res.status(201).json(message);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Mark a message as read
  app.patch("/api/messages/:id/read", isAuthenticated, async (req, res, next) => {
    try {
      const messageId = Number(req.params.id);
      
      // TODO: Add check to make sure user is the receiver
      
      const success = await storage.markMessageAsRead(messageId);
      res.json({ success });
    } catch (error) {
      next(error);
    }
  });
  
  // Get unread message count
  app.get("/api/messages/unread-count", isAuthenticated, async (req, res, next) => {
    try {
      const count = await storage.getUnreadMessageCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  });

  // User profile with stats, ratings, and history
  app.get("/api/users/:id/profile", async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const ratings = await storage.getRatingsByUserId(userId);
      // Recent donations made (as posts)
      const allDonations = await storage.getFoodPosts({ userId, type: "donation", limit: 20 });
      const donations = allDonations.filter((p: any) => p.status === "completed").slice(0, 5);
      // Recent donations received (as claims)
      const allClaims = await storage.getClaims({ claimerId: userId, limit: 20 });
      const claims = allClaims.filter((c: any) => c.status === "completed").slice(0, 5);
      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        profileImage: user.profileImage,
        donationCount: user.donationCount,
        receivedCount: user.receivedCount,
        averageRating: user.averageRating,
        ratingCount: user.ratingCount,
        isTrusted: user.isTrusted,
        createdAt: user.createdAt,
        ratings,
        recentDonations: donations,
        recentReceived: claims
      });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
