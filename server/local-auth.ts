import { Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { comparePasswords, generateSessionId } from "./auth-utils";
import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface AuthSession extends session.Session {
  userId?: string;
}

/**
 * Login endpoint for local authentication
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isValidPassword = await comparePasswords(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Create session
    const authSession = req.session as AuthSession;
    authSession.userId = user.id;

    // Return user data (exclude password)
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
}

/**
 * Logout endpoint
 */
export function logout(req: Request, res: Response) {
  const authSession = req.session as AuthSession;
  authSession.userId = undefined;
  
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logout successful" });
  });
}

/**
 * Get current user endpoint
 */
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Return user data (exclude password)
    const { password: _, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Failed to get user data" });
  }
}

/**
 * Authentication middleware
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authSession = req.session as AuthSession;
    
    if (!authSession.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Get user from database
    const user = await storage.getUser(authSession.userId);
    if (!user) {
      // Clear invalid session
      authSession.userId = undefined;
      return res.status(401).json({ message: "Invalid session" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(["admin"]);

/**
 * Admin or order manager middleware
 */
export const requireOrderManager = requireRole(["admin", "order_manager"]);