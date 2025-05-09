import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API routes will be added here as the application grows
  // e.g. food listing routes, user profile routes, etc.

  const httpServer = createServer(app);

  return httpServer;
}
