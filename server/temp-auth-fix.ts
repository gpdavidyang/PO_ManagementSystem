// Local authentication middleware
import { Request, Response, NextFunction } from "express";
import session from "express-session";

// Session-based authentication middleware
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authSession = req.session as any;
    
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

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
}

export const requireAdmin = requireAuth;
export const requireOrderManager = requireAuth;

import { storage } from "./storage";
import { comparePasswords } from "./auth-utils";

// Session interface
interface AuthSession {
  userId?: string;
}

// Login endpoint
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt for:", email);

    if (!email || !password) {
      console.log("🔐 Missing email or password");
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      console.log("🔐 User not found for email:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("🔐 User found:", user.email, "ID:", user.id);

    // Verify password
    const isValidPassword = await comparePasswords(password, user.password);
    if (!isValidPassword) {
      console.log("🔐 Invalid password for user:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("🔐 Password verified successfully");

    // Create session
    const authSession = req.session as any;
    authSession.userId = user.id;

    console.log("🔐 Session created:", {
      sessionId: req.sessionID,
      userId: user.id,
      sessionKeys: Object.keys(authSession)
    });

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error("🔐 Session save error:", err);
      } else {
        console.log("🔐 Session saved successfully");
      }
    });

    // Return user data (exclude password)
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
}

// Logout endpoint
export function logout(req: Request, res: Response) {
  const authSession = req.session as any;
  
  console.log("Logout attempt:", {
    sessionId: req.sessionID,
    userId: authSession?.userId,
    sessionKeys: Object.keys(authSession || {})
  });
  
  // First clear the session data
  delete authSession.userId;
  
  // Then destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
    } else {
      console.log("Session destroyed successfully");
    }
    
    // Clear the session cookie regardless of destroy success
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: false
    });
    
    console.log("Logout completed");
    res.json({ message: "Logout successful" });
  });
}

// Get current user endpoint
export async function getCurrentUser(req: Request, res: Response) {
  try {
    const authSession = req.session as any;
    
    // Debug logging
    console.log("🔍 Session check:", { 
      sessionId: req.sessionID,
      userId: authSession?.userId,
      sessionKeys: Object.keys(authSession || {}),
      cookies: req.headers.cookie,
      userAgent: req.headers['user-agent']?.substring(0, 50)
    });
    
    if (!authSession?.userId) {
      console.log("🔍 No userId in session - user not authenticated");
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get user from database
    const user = await storage.getUser(authSession.userId);
    if (!user) {
      // Clear invalid session
      delete authSession.userId;
      return res.status(401).json({ message: "Invalid session" });
    }

    // Return user data (exclude password)
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Failed to get user data" });
  }
}