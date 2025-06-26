import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { login, logout, getCurrentUser, requireAuth, requireAdmin, requireOrderManager } from "./temp-auth-fix";
import { seedData } from "./seed-data";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { insertOrderTemplateSchema, insertProjectSchema } from "@shared/schema";
import { insertVendorSchema, insertItemSchema, insertPurchaseOrderSchema, insertInvoiceSchema, insertItemReceiptSchema, insertVerificationLogSchema, insertPositionSchema, insertCompanySchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import nodemailer from "nodemailer";
import XLSX from "xlsx";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/dwg",
      "application/x-dwg",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware for local authentication
  const PostgresSessionStore = connectPg(session);
  const sessionStore = new PostgresSessionStore({ 
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false  // Table already exists, don't try to create
  });

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid', // Use default session cookie name for better compatibility
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' // Add sameSite for better cookie handling
    }
  }));

  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Local authentication routes
  app.post('/api/auth/login', login);
  app.post('/api/auth/logout', logout);
  app.get('/api/logout', logout); // Support both GET and POST for logout
  app.get('/api/auth/user', getCurrentUser);

  // User management routes
  app.get("/api/users", async (req, res) => {
    try {
      // Skip authentication check for development
      // TODO: Re-enable proper authentication in production

      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      // Skip authentication check for development
      // TODO: Re-enable proper authentication in production

      const { email, name, phoneNumber, role, positionId } = req.body;
      
      // Let the storage layer generate standardized ID
      const newUser = await storage.upsertUser({
        email,
        name,
        phoneNumber,
        role: role || "user",
        positionId,
        password: "temp123", // Temporary password - should be changed by user
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      // Skip authentication check for development
      // TODO: Re-enable proper authentication in production

      const userId = req.params.id;
      const { name, phoneNumber, role, positionId } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        id: userId,
        email: user.email,
        name: name || user.name,
        phoneNumber: phoneNumber || user.phoneNumber,
        role: role || user.role,
        positionId: positionId !== undefined ? positionId : user.positionId,
        profileImageUrl: user.profileImageUrl,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/users/:id/references", async (req, res) => {
    try {
      // Skip authentication check for development
      // TODO: Re-enable proper authentication in production

      const id = req.params.id;
      const references = await storage.checkUserReferences(id);
      res.json(references);
    } catch (error) {
      console.error("Error checking user references:", error);
      res.status(500).json({ message: "Failed to check user references" });
    }
  });

  app.post("/api/users/:id/reassign", async (req, res) => {
    try {
      // Skip authentication check for development
      // TODO: Re-enable proper authentication in production

      const fromUserId = req.params.id;
      const { toUserId } = req.body;
      
      if (!toUserId) {
        return res.status(400).json({ message: "새 담당자 ID가 필요합니다" });
      }

      await storage.reassignUserProjects(fromUserId, toUserId);
      res.json({ message: "프로젝트 담당자가 변경되었습니다" });
    } catch (error) {
      console.error("Error reassigning user projects:", error);
      res.status(500).json({ message: "Failed to reassign user projects" });
    }
  });

  app.patch("/api/users/:id/toggle-active", async (req, res) => {
    try {
      // Skip authentication check for development
      // TODO: Re-enable proper authentication in production

      const userId = req.params.id;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive 값이 필요합니다" });
      }

      const updatedUser = await storage.toggleUserActive(userId, isActive);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error toggling user active status:", error);
      res.status(500).json({ message: "Failed to toggle user active status" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      // Skip authentication check for development
      // TODO: Re-enable proper authentication in production

      const userId = req.params.id;
      const currentUserId = (req.user as any)?.claims?.sub;

      // Prevent users from deleting themselves
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ 
        message: "Failed to delete user",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.patch('/api/auth/profile', requireAuth, async (req: any, res) => {
    try {
      // Use the database user ID from req.user, not the auth system ID
      const userId = req.user.id;  // This should be the database user ID
      const { name } = req.body;
      
      console.log("Profile update request:", { userId, name, fullUser: req.user }); // Debug logging
      
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      const updatedUser = await storage.updateUser(userId, { name });
      
      console.log("Profile updated successfully:", updatedUser); // Debug logging
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch('/api/auth/preferences', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const preferences = req.body;
      
      // 환경설정은 사용자 테이블에 JSON 필드로 저장하거나 별도 테이블로 관리할 수 있습니다
      // 여기서는 간단히 성공 응답만 반환합니다
      res.json({ message: "Preferences updated successfully" });
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/users/:id', requireAuth, async (req: any, res) => {
    try {
      const adminUserId = req.user?.id || req.user?.claims?.sub;
      const adminUser = await storage.getUser(adminUserId);
      
      if (adminUser?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.id;
      const { role } = req.body;
      
      if (!role || !["admin", "orderer"].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.patch('/api/users/:id', requireAuth, async (req: any, res) => {
    try {
      const adminUserId = req.user?.id || req.user?.claims?.sub;
      const adminUser = await storage.getUser(adminUserId);
      
      if (adminUser?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.id;
      const updateData = req.body;
      
      // Validate role if provided
      if (updateData.role && !["admin", "order_manager", "user"].includes(updateData.role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = process.env.NODE_ENV === 'development' ? 'USR_20250531_001' : req.user.id;
      const user = await storage.getUser(userId);
      
      // Admin can see all stats, orderers see only their own
      const stats = await storage.getDashboardStats(
        user?.role === "admin" ? undefined : userId
      );
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Monthly order statistics
  app.get('/api/dashboard/monthly-stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      const monthlyStats = await storage.getMonthlyOrderStats(
        user?.role === "admin" ? undefined : userId
      );
      
      res.json(monthlyStats);
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
      res.status(500).json({ message: "Failed to fetch monthly stats" });
    }
  });

  // Vendor order statistics
  app.get('/api/dashboard/vendor-stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      const vendorStats = await storage.getVendorOrderStats(
        user?.role === "admin" ? undefined : userId
      );
      res.json(vendorStats);
    } catch (error) {
      console.error("Error fetching vendor stats:", error);
      res.status(500).json({ message: "Failed to fetch vendor stats" });
    }
  });

  // Status order statistics
  app.get('/api/dashboard/status-stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      const statusStats = await storage.getStatusOrderStats(
        user?.role === "admin" ? undefined : userId
      );
      res.json(statusStats);
    } catch (error) {
      console.error("Error fetching status stats:", error);
      res.status(500).json({ message: "Failed to fetch status stats" });
    }
  });

  // Project order statistics
  app.get('/api/dashboard/project-stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      const projectStats = await storage.getProjectOrderStats(
        user?.role === "admin" ? undefined : userId
      );
      res.json(projectStats);
    } catch (error) {
      console.error("Error fetching project stats:", error);
      res.status(500).json({ message: "Failed to fetch project stats" });
    }
  });

  // Enhanced dashboard endpoints
  app.get('/api/dashboard/active-projects-count', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      const count = await storage.getActiveProjectsCount(
        user?.role === "admin" ? undefined : userId
      );
      res.json({ count });
    } catch (error) {
      console.error("Error fetching active projects count:", error);
      res.status(500).json({ message: "Failed to fetch active projects count" });
    }
  });

  app.get('/api/dashboard/new-projects-this-month', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      const count = await storage.getNewProjectsThisMonth(
        user?.role === "admin" ? undefined : userId
      );
      res.json({ count });
    } catch (error) {
      console.error("Error fetching new projects this month:", error);
      res.status(500).json({ message: "Failed to fetch new projects this month" });
    }
  });

  app.get('/api/dashboard/recent-projects', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      const projects = await storage.getRecentProjectsThisMonth(
        user?.role === "admin" ? undefined : userId
      );
      res.json(projects);
    } catch (error) {
      console.error("Error fetching recent projects:", error);
      res.status(500).json({ message: "Failed to fetch recent projects" });
    }
  });

  app.get('/api/dashboard/urgent-orders', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      const orders = await storage.getUrgentOrders(
        user?.role === "admin" ? undefined : userId
      );
      res.json(orders);
    } catch (error) {
      console.error("Error fetching urgent orders:", error);
      res.status(500).json({ message: "Failed to fetch urgent orders" });
    }
  });

  // Project Members API
  app.get('/api/project-members', requireAuth, async (req, res) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const members = await storage.getProjectMembers(projectId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  app.post('/api/project-members', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const memberData = req.body;
      const member = await storage.createProjectMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error creating project member:", error);
      res.status(500).json({ message: "Failed to create project member" });
    }
  });

  app.delete('/api/project-members/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteProjectMember(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project member:", error);
      res.status(500).json({ message: "Failed to delete project member" });
    }
  });

  // Unified Dashboard API - combines all dashboard data in single call
  app.get('/api/dashboard/unified', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === "admin";
      
      // Execute all dashboard queries in parallel for maximum performance
      const [
        stats,
        monthlyStats,
        orders,
        activeProjectsCount,
        newProjectsThisMonth
      ] = await Promise.all([
        storage.getDashboardStats(isAdmin ? undefined : userId),
        storage.getMonthlyOrderStats(isAdmin ? undefined : userId),
        storage.getPurchaseOrders({}),
        storage.getActiveProjectsCount(isAdmin ? undefined : userId),
        storage.getNewProjectsThisMonth(isAdmin ? undefined : userId)
      ]);

      // Get recent projects from orders data
      const orderList = orders.orders || [];
      const recentProjects = orderList.slice(0, 5).map((order: any) => ({
        id: order.projectId,
        projectName: order.projectName,
        projectCode: order.projectCode,
        createdAt: order.orderDate
      }));

      // Generate project stats as array with proper structure
      const projectStatsMap = orderList.reduce((acc: any, order: any) => {
        // Get project name from the project object if available
        const projectName = order.project?.projectName || order.projectName || 'Unknown Project';
        const projectCode = order.project?.projectCode || order.projectCode || '';
        const projectId = order.project?.id || order.projectId;
        
        if (!acc[projectName]) {
          acc[projectName] = {
            id: projectId,
            projectName: projectName,
            projectCode: projectCode,
            orderCount: 0,
            totalAmount: 0
          };
        }
        acc[projectName].orderCount += 1;
        acc[projectName].totalAmount += Number(order.totalAmount) || 0;
        return acc;
      }, {});

      const projectStats = Object.values(projectStatsMap)
        .sort((a: any, b: any) => b.totalAmount - a.totalAmount);

      // Generate status stats as array with proper structure
      const statusStatsMap = orderList.reduce((acc: any, order: any) => {
        const status = order.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const statusStats = Object.entries(statusStatsMap).map(([status, orders]) => ({
        status,
        orders,
        name: status
      }));

      res.json({
        stats,
        monthlyStats,
        projectStats,
        statusStats,
        orders,
        activeProjectsCount: { count: activeProjectsCount },
        newProjectsThisMonth: { count: newProjectsThisMonth },
        recentProjects,
        urgentOrders: []
      });
    } catch (error) {
      console.error("Error fetching unified dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Vendor routes
  app.get('/api/vendors', requireAuth, async (req, res) => {
    try {
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  // Project status routes
  app.get('/api/project-statuses', requireAuth, async (req, res) => {
    try {
      const statuses = await storage.getProjectStatuses();
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching project statuses:", error);
      res.status(500).json({ message: "Failed to fetch project statuses" });
    }
  });

  // Project type routes
  app.get('/api/project-types', requireAuth, async (req, res) => {
    try {
      const types = await storage.getProjectTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching project types:", error);
      res.status(500).json({ message: "Failed to fetch project types" });
    }
  });

  // Project routes
  app.get('/api/projects', requireAuth, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      console.log("Project creation request body:", req.body);
      
      // Transform the data to match schema expectations
      const transformedData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        totalBudget: req.body.totalBudget ? req.body.totalBudget : null,
      };
      
      console.log("Transformed project data:", transformedData);
      const validatedData = insertProjectSchema.parse(transformedData);
      console.log("Validated project data:", validatedData);
      
      const project = await storage.createProject(validatedData);
      console.log("Created project:", project);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Failed to create project", error: error.message });
    }
  });

  app.patch('/api/projects/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id, 10);
      const { orderManagers, ...projectData } = req.body;
      
      console.log("Project update request:", { id, projectData });
      
      // Transform data before validation
      const transformedData = {
        ...projectData,
        startDate: projectData.startDate ? new Date(projectData.startDate) : undefined,
        endDate: projectData.endDate ? new Date(projectData.endDate) : undefined,
        totalBudget: projectData.totalBudget ? projectData.totalBudget : undefined,
      };
      
      console.log("Transformed project data:", transformedData);
      
      const validatedData = insertProjectSchema.partial().parse(transformedData);
      console.log("Validated project data:", validatedData);
      
      const project = await storage.updateProject(id, validatedData);
      console.log("Updated project result:", project);

      // Handle multiple order managers
      if (orderManagers && Array.isArray(orderManagers)) {
        // Get existing project members with order_manager role
        const existingMembers = await storage.getProjectMembers(id);
        const existingOrderManagers = existingMembers.filter(member => member.role === 'order_manager');
        
        // Remove existing order managers
        for (const member of existingOrderManagers) {
          await storage.deleteProjectMember(member.id);
        }
        
        // Add new order managers
        for (const managerId of orderManagers) {
          await storage.createProjectMember({
            projectId: id,
            userId: managerId,
            role: 'order_manager'
          });
        }
      }

      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id, 10);
      await storage.deleteProject(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Order status routes (public access)
  app.get('/api/order-statuses', async (req, res) => {
    try {
      const statuses = await storage.getOrderStatuses();
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching order statuses:", error);
      res.status(500).json({ message: "Failed to fetch order statuses" });
    }
  });

  // Template routes (public access)
  app.get('/api/templates', async (req, res) => {
    try {
      const templates = await storage.getActiveOrderTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get('/api/templates/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const template = await storage.getOrderTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  // Order template routes (authenticated admin access)
  app.get('/api/order-templates', requireAuth, async (req, res) => {
    try {
      const templates = await storage.getOrderTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching order templates:", error);
      res.status(500).json({ message: "Failed to fetch order templates" });
    }
  });

  app.get('/api/order-templates/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const template = await storage.getOrderTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post('/api/order-templates', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertOrderTemplateSchema.parse(req.body);
      const template = await storage.createOrderTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put('/api/order-templates/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id, 10);
      const validatedData = insertOrderTemplateSchema.partial().parse(req.body);
      const template = await storage.updateOrderTemplate(id, validatedData);
      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete('/api/order-templates/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id, 10);
      await storage.deleteOrderTemplate(id);
      
      // Set cache-busting headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  app.patch('/api/order-templates/:id/toggle-status', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id, 10);
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean value" });
      }

      const template = await storage.toggleOrderTemplateStatus(id, isActive);
      res.json(template);
    } catch (error) {
      console.error("Error toggling template status:", error);
      res.status(500).json({ message: "Failed to toggle template status" });
    }
  });

  // Item routes
  app.get('/api/items', requireAuth, async (req, res) => {
    try {
      const { category, searchText, isActive, page = '1', limit = '50' } = req.query;
      
      const filters = {
        category: category as string,
        searchText: searchText as string,
        isActive: isActive === 'false' ? false : true,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10)
      };

      const result = await storage.getItems(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  // 카테고리 목록 조회
  app.get('/api/items/categories', requireAuth, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/items/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const item = await storage.getItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post('/api/items', requireAuth, async (req, res) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      const item = await storage.createItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating item:", error);
      if (error instanceof Error && error.message.includes('validation')) {
        res.status(400).json({ message: "Invalid item data" });
      } else {
        res.status(500).json({ message: "Failed to create item" });
      }
    }
  });

  app.patch('/api/items/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const itemData = insertItemSchema.partial().parse(req.body);
      const item = await storage.updateItem(id, itemData);
      res.json(item);
    } catch (error) {
      console.error("Error updating item:", error);
      if (error instanceof Error && error.message.includes('validation')) {
        res.status(400).json({ message: "Invalid item data" });
      } else {
        res.status(500).json({ message: "Failed to update item" });
      }
    }
  });

  app.delete('/api/items/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await storage.deleteItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  app.get('/api/vendors/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vendor = await storage.getVendor(id);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      res.json(vendor);
    } catch (error) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  app.post('/api/vendors', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const vendorData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(vendorData);
      res.status(201).json(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vendor data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  app.put('/api/vendors/:id', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const vendorData = insertVendorSchema.partial().parse(req.body);
      const vendor = await storage.updateVendor(id, vendorData);
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vendor data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  app.patch('/api/vendors/:id', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      console.log('PATCH vendor request:', { id, body: req.body });
      const vendorData = insertVendorSchema.partial().parse(req.body);
      console.log('Parsed vendor data:', vendorData);
      const vendor = await storage.updateVendor(id, vendorData);
      console.log('Updated vendor:', vendor);
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vendor data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  app.delete('/api/vendors/:id', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteVendor(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      res.status(500).json({ message: "Failed to delete vendor" });
    }
  });

  // Purchase order routes
  app.get('/api/orders', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      const vendorIdParam = req.query.vendorId;
      const vendorId = vendorIdParam && vendorIdParam !== "all" && vendorIdParam !== "" ? parseInt(vendorIdParam) : undefined;
      
      const templateIdParam = req.query.templateId;
      const templateId = templateIdParam && templateIdParam !== "all" && templateIdParam !== "" ? parseInt(templateIdParam) : undefined;
      
      const projectIdParam = req.query.projectId;
      const projectId = projectIdParam && projectIdParam !== "all" && projectIdParam !== "" ? parseInt(projectIdParam) : undefined;
      
      const filters = {
        userId: user?.role === "admin" && req.query.userId && req.query.userId !== "all" ? req.query.userId : (user?.role === "admin" ? undefined : user?.id),
        status: req.query.status && req.query.status !== "all" ? req.query.status : undefined,
        vendorId: vendorId,
        templateId: templateId,
        projectId: projectId,
        startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount) : undefined,
        searchText: req.query.searchText,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 10,
      };

      console.log('Order filters:', filters);
      const result = await storage.getPurchaseOrders(filters);
      console.log('Order result count:', result.orders.length);
      res.json(result);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Export orders to Excel (must be before /:id route)
  app.get('/api/orders/export', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      console.log('Export request params:', req.query);
      
      const vendorIdParam = req.query.vendorId;
      const vendorId = vendorIdParam && vendorIdParam !== "all" ? parseInt(vendorIdParam) : undefined;
      
      const projectIdParam = req.query.projectId;
      const projectId = projectIdParam && projectIdParam !== "all" && projectIdParam !== "" ? parseInt(projectIdParam) : undefined;
      
      const filters = {
        userId: user?.role === "admin" && req.query.userId && req.query.userId !== "all" ? req.query.userId : (user?.role === "admin" ? undefined : userId),
        status: req.query.status && req.query.status !== "all" ? req.query.status : undefined,
        vendorId: vendorId,
        projectId: projectId,
        startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount) : undefined,
        searchText: req.query.searchText,
        limit: 1000, // Export more records
      };
      
      console.log('Export filters:', filters);

      const { orders } = await storage.getPurchaseOrders(filters);
      
      const excelData = orders.map(order => ({
        '발주번호': order.orderNumber,
        '거래처': order.vendor?.name || '',
        '발주일자': order.orderDate,
        '납기희망일': order.deliveryDate,
        '주요품목': order.items?.map(item => item.itemName).join(', ') || '',
        '총금액': order.totalAmount,
        '상태': order.status,
        '작성자': order.user?.name || '',
        '특이사항': order.notes || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting orders:", error);
      res.status(500).json({ message: "Failed to export orders" });
    }
  });

  app.get('/api/orders/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = process.env.NODE_ENV === 'development' ? 'USR_20250531_001' : req.user.id;
      console.log('Development mode - bypassing authentication');
      const user = await storage.getUser(userId);
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getPurchaseOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check access permissions - use the actual database user ID for comparison
      if (user?.role !== "admin" && order.userId !== user?.id) {
        console.log('Access denied - userId:', order.userId, 'user.id:', user?.id, 'user.role:', user?.role);
        return res.status(403).json({ message: "Access denied" });
      }



      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Convert date strings to Date objects and handle data types
      const processedData = {
        ...req.body,
        userId,
        orderDate: req.body.orderDate ? new Date(req.body.orderDate) : new Date(),
        deliveryDate: req.body.deliveryDate ? new Date(req.body.deliveryDate) : null,
        totalAmount: typeof req.body.totalAmount === 'string' ? parseFloat(req.body.totalAmount) || 0 : req.body.totalAmount || 0,
        projectId: req.body.projectId ? parseInt(req.body.projectId) : null,
        vendorId: req.body.vendorId ? parseInt(req.body.vendorId) : null,
        templateId: req.body.templateId ? parseInt(req.body.templateId) : null,
      };

      const orderData = insertPurchaseOrderSchema.parse(processedData);
      const order = await storage.createPurchaseOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put('/api/orders/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = process.env.NODE_ENV === 'development' ? 'USR_20250531_001' : req.user.id;
      const user = await storage.getUser(userId);
      const id = parseInt(req.params.id);
      
      const order = await storage.getPurchaseOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check access permissions
      if (user?.role !== "admin" && order.userId !== user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { items, ...orderData } = req.body;
      const updatedOrder = await storage.updatePurchaseOrder(id, orderData);
      
      if (items) {
        await storage.updatePurchaseOrderItems(id, items.map((item: any) => ({ 
          ...item, 
          orderId: id,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalAmount: Number(item.quantity) * Number(item.unitPrice)
        })));
        
        // Recalculate total order amount after updating items
        await storage.recalculateOrderTotal(id);
      }

      // Get the updated order with recalculated total
      const finalOrder = await storage.getPurchaseOrder(id);
      res.json(finalOrder);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.patch('/api/orders/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = process.env.NODE_ENV === 'development' ? 'USR_20250531_001' : req.user.id;
      const user = await storage.getUser(userId);
      const id = parseInt(req.params.id);
      
      const order = await storage.getPurchaseOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check access permissions
      if (user?.role !== "admin" && order.userId !== user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { items, ...orderData } = req.body;
      
      // Handle date conversion for PATCH requests
      if (orderData.orderDate) {
        orderData.orderDate = new Date(orderData.orderDate);
      }
      if (orderData.deliveryDate) {
        orderData.deliveryDate = new Date(orderData.deliveryDate);
      }
      if (orderData.vendorId) {
        orderData.vendorId = parseInt(orderData.vendorId);
      }
      
      const updatedOrder = await storage.updatePurchaseOrder(id, orderData);
      
      if (items && items.length > 0) {
        await storage.updatePurchaseOrderItems(id, items.map((item: any) => ({ 
          ...item, 
          orderId: id,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalAmount: Number(item.quantity) * Number(item.unitPrice)
        })));
        
        // Recalculate total order amount after updating items
        await storage.recalculateOrderTotal(id);
      }

      // Get the updated order with recalculated total
      const finalOrder = await storage.getPurchaseOrder(id);
      res.json(finalOrder);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.delete('/api/orders/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = process.env.NODE_ENV === 'development' ? 'USR_20250531_001' : req.user.id;
      const user = await storage.getUser(userId);
      const id = parseInt(req.params.id);
      
      const order = await storage.getPurchaseOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check access permissions
      if (user?.role !== "admin" && order.userId !== user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deletePurchaseOrder(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Order approval (admin only)
  app.post('/api/orders/:id/approve', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const order = await storage.approvePurchaseOrder(id, userId);
      res.json(order);
    } catch (error) {
      console.error("Error approving order:", error);
      res.status(500).json({ message: "Failed to approve order" });
    }
  });

  // File upload for orders
  app.post('/api/orders/:id/attachments', requireAuth, upload.array('files'), async (req: any, res) => {
    try {
      const userId = process.env.NODE_ENV === 'development' ? 'USR_20250531_001' : req.user.id;
      const user = await storage.getUser(userId);
      const orderId = parseInt(req.params.id);
      
      const order = await storage.getPurchaseOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check access permissions
      if (user?.role !== "admin" && order.userId !== user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const attachments = await Promise.all(
        req.files.map(async (file: any) => {
          const attachment = await storage.createAttachment({
            orderId,
            fileName: file.filename,
            originalName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            filePath: file.path,
          });
          return attachment;
        })
      );

      res.status(201).json(attachments);
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  // Generate PDF for order
  app.get('/api/orders/:id/pdf', requireAuth, async (req: any, res) => {
    try {
      const userId = process.env.NODE_ENV === 'development' ? 'USR_20250531_001' : req.user.id;
      const user = await storage.getUser(userId);
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getPurchaseOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check access permissions
      if (user?.role !== "admin" && order.userId !== user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Generate HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>발주서 ${order.orderNumber}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { 
              font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; 
              font-size: 11px; 
              line-height: 1.3; 
              color: #000; 
              margin: 0; 
              padding: 0; 
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 8px; 
              margin-bottom: 15px; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 18px; 
              font-weight: bold; 
              color: #333; 
            }
            .order-number { 
              font-size: 10px; 
              color: #666; 
            }
            .info-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin-bottom: 20px; 
            }
            .info-section h3 { 
              font-size: 12px; 
              font-weight: bold; 
              margin: 0 0 8px 0; 
              background-color: #f5f5f5; 
              padding: 4px 8px; 
              border: 1px solid #ddd; 
            }
            .info-item { 
              display: flex; 
              margin-bottom: 4px; 
            }
            .label { 
              font-weight: bold; 
              width: 80px; 
              flex-shrink: 0; 
            }
            .value { 
              flex: 1; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px; 
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px; 
              text-align: left; 
              font-size: 10px; 
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold; 
            }
            .text-right { 
              text-align: right; 
            }
            .notes { 
              margin-top: 15px; 
              padding: 8px; 
              border: 1px solid #ddd; 
              background-color: #f9f9f9; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>발주서 Purchase Order</h1>
            <div class="order-number">발주번호: ${order.orderNumber}</div>
          </div>
          
          <div class="info-grid">
            <div class="info-section">
              <h3>거래처 정보</h3>
              <div class="info-item">
                <span class="label">회사명:</span>
                <span class="value">${order.vendor?.name || '-'}</span>
              </div>
              <div class="info-item">
                <span class="label">사업자번호:</span>
                <span class="value">${order.vendor?.businessNumber || '-'}</span>
              </div>
              <div class="info-item">
                <span class="label">연락처:</span>
                <span class="value">${order.vendor?.phone || '-'}</span>
              </div>
              <div class="info-item">
                <span class="label">이메일:</span>
                <span class="value">${order.vendor?.email || '-'}</span>
              </div>
              <div class="info-item">
                <span class="label">주소:</span>
                <span class="value">${order.vendor?.address || '-'}</span>
              </div>
            </div>
            
            <div class="info-section">
              <h3>발주 정보</h3>
              <div class="info-item">
                <span class="label">발주일자:</span>
                <span class="value">${order.orderDate ? new Date(order.orderDate).toLocaleDateString('ko-KR') : '-'}</span>
              </div>
              <div class="info-item">
                <span class="label">납품희망일:</span>
                <span class="value">${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('ko-KR') : '-'}</span>
              </div>
              <div class="info-item">
                <span class="label">발주자:</span>
                <span class="value">${order.user?.name || ''}</span>
              </div>
              <div class="info-item">
                <span class="label">상태:</span>
                <span class="value">${order.status === 'pending' ? '대기' : order.status === 'approved' ? '승인' : order.status === 'sent' ? '발송' : order.status}</span>
              </div>
            </div>
          </div>
          
          <h3>발주 품목</h3>
          <table>
            <thead>
              <tr>
                <th>품목명</th>
                <th>규격</th>
                <th>수량</th>
                <th>단가</th>
                <th>금액</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              ${order.items?.map(item => `
                <tr>
                  <td>${item.itemName}</td>
                  <td>${item.specification || '-'}</td>
                  <td class="text-right">${Number(item.quantity).toLocaleString('ko-KR')}</td>
                  <td class="text-right">₩${Number(item.unitPrice).toLocaleString('ko-KR')}</td>
                  <td class="text-right">₩${Number(item.totalAmount).toLocaleString('ko-KR')}</td>
                  <td>${item.notes || '-'}</td>
                </tr>
              `).join('') || ''}
            </tbody>
            <tfoot>
              <tr>
                <th colspan="4">총 금액</th>
                <th class="text-right">₩${Number(order.totalAmount || 0).toLocaleString('ko-KR')}</th>
                <th></th>
              </tr>
            </tfoot>
          </table>
          
          ${order.notes ? `
            <div class="notes">
              <strong>특이사항:</strong><br>
              ${order.notes.replace(/\n/g, '<br>')}
            </div>
          ` : ''}
        </body>
        </html>
      `;

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="order-${order.orderNumber}.pdf"`);
      
      // For now, return HTML content that can be printed as PDF by browser
      // In a production environment, you would use a library like puppeteer to generate actual PDF
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlContent);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Send order via email
  app.post('/api/orders/:id/send', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getPurchaseOrder(id);
      if (!order || !order.vendor) {
        return res.status(404).json({ message: "Order or vendor not found" });
      }

      // Check access permissions and approval
      if (user?.role !== "admin" && order.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!order.isApproved && user?.role !== "admin") {
        return res.status(400).json({ message: "Order must be approved before sending" });
      }

      // Send email
      const emailContent = `
        발주서 ${order.orderNumber}
        
        거래처: ${order.vendor.name}
        발주일자: ${order.orderDate}
        납기희망일: ${order.deliveryDate}
        
        발주 품목:
        ${order.items?.map(item => `- ${item.itemName} (${item.specification}) x ${item.quantity} = ${item.totalAmount}원`).join('\n')}
        
        총 금액: ${order.totalAmount}원
        
        특이사항: ${order.notes || '없음'}
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: order.vendor.email,
        subject: `발주서 ${order.orderNumber}`,
        text: emailContent,
      });

      // Update order status
      await storage.updatePurchaseOrder(id, {
        status: "sent",
        sentAt: new Date(),
      });

      res.json({ message: "Order sent successfully" });
    } catch (error) {
      console.error("Error sending order:", error);
      res.status(500).json({ message: "Failed to send order" });
    }
  });



  // Invoice routes
  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      const orderId = req.query.orderId ? parseInt(req.query.orderId as string) : undefined;
      const invoices = await storage.getInvoices(orderId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", requireAuth, upload.single('file'), async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const data = insertInvoiceSchema.parse({
        ...req.body,
        orderId: parseInt(req.body.orderId),
        totalAmount: parseFloat(req.body.totalAmount),
        vatAmount: parseFloat(req.body.vatAmount || 0),
        issueDate: new Date(req.body.issueDate),
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        uploadedBy: userId,
        filePath: req.file?.path,
      });

      const invoice = await storage.createInvoice(data);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.patch("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.totalAmount) updates.totalAmount = parseFloat(updates.totalAmount);
      if (updates.vatAmount) updates.vatAmount = parseFloat(updates.vatAmount);
      if (updates.issueDate) updates.issueDate = new Date(updates.issueDate);
      if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);

      const invoice = await storage.updateInvoice(id, updates);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.post("/api/invoices/:id/verify", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const invoice = await storage.verifyInvoice(id, userId);
      res.json(invoice);
    } catch (error) {
      console.error("Error verifying invoice:", error);
      res.status(500).json({ message: "Failed to verify invoice" });
    }
  });

  app.delete("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInvoice(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Tax invoice issuance management
  app.post("/api/invoices/:id/issue-tax", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const invoice = await storage.updateInvoice(id, {
        taxInvoiceIssued: true,
        taxInvoiceIssuedDate: new Date(),
        taxInvoiceIssuedBy: userId,
      });

      res.json(invoice);
    } catch (error) {
      console.error("Error issuing tax invoice:", error);
      res.status(500).json({ message: "Failed to issue tax invoice" });
    }
  });

  app.post("/api/invoices/:id/cancel-tax", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const invoice = await storage.updateInvoice(id, {
        taxInvoiceIssued: false,
        taxInvoiceIssuedDate: null,
        taxInvoiceIssuedBy: null,
      });

      res.json(invoice);
    } catch (error) {
      console.error("Error canceling tax invoice:", error);
      res.status(500).json({ message: "Failed to cancel tax invoice" });
    }
  });

  // Item receipt routes
  app.get("/api/item-receipts", requireAuth, async (req, res) => {
    try {
      const orderItemId = req.query.orderItemId ? parseInt(req.query.orderItemId as string) : undefined;
      const receipts = await storage.getItemReceipts(orderItemId);
      
      // Disable caching to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching item receipts:", error);
      res.status(500).json({ message: "Failed to fetch item receipts" });
    }
  });

  app.post("/api/item-receipts", requireAuth, async (req: any, res) => {
    try {
      const userId = process.env.NODE_ENV === 'development' ? 'USR_20250531_001' : req.user.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      console.log("Request body:", req.body);
      console.log("User ID:", userId, "Type:", typeof userId);

      const data = insertItemReceiptSchema.parse({
        ...req.body,
        verifiedBy: String(userId),
      });

      const receipt = await storage.createItemReceipt(data);
      res.status(201).json(receipt);
    } catch (error) {
      console.error("Error creating item receipt:", error);
      res.status(500).json({ message: "Failed to create item receipt" });
    }
  });

  app.patch("/api/item-receipts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.receivedQuantity) updates.receivedQuantity = parseFloat(updates.receivedQuantity);
      if (updates.receivedDate) updates.receivedDate = new Date(updates.receivedDate);
      if (updates.qualityCheck !== undefined) updates.qualityCheck = Boolean(updates.qualityCheck);

      const receipt = await storage.updateItemReceipt(id, updates);
      res.json(receipt);
    } catch (error) {
      console.error("Error updating item receipt:", error);
      res.status(500).json({ message: "Failed to update item receipt" });
    }
  });

  app.delete("/api/item-receipts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteItemReceipt(id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting item receipt:", error);
      res.status(500).json({ message: "Failed to delete item receipt" });
    }
  });

  // UI Terms API endpoints
  app.get("/api/ui-terms", async (req, res) => {
    try {
      const category = req.query.category as string;
      const terms = await storage.getUiTerms(category);
      res.json(terms);
    } catch (error) {
      console.error("Error fetching UI terms:", error);
      res.status(500).json({ message: "Failed to fetch UI terms" });
    }
  });

  app.get("/api/ui-terms/:termKey", async (req, res) => {
    try {
      const termKey = req.params.termKey;
      const term = await storage.getUiTerm(termKey);
      if (!term) {
        return res.status(404).json({ message: "Term not found" });
      }
      res.json(term);
    } catch (error) {
      console.error("Error fetching UI term:", error);
      res.status(500).json({ message: "Failed to fetch UI term" });
    }
  });

  // Verification logs routes
  app.get("/api/verification-logs", requireAuth, async (req, res) => {
    try {
      const orderId = req.query.orderId ? parseInt(req.query.orderId as string) : undefined;
      const invoiceId = req.query.invoiceId ? parseInt(req.query.invoiceId as string) : undefined;
      const logs = await storage.getVerificationLogs(orderId, invoiceId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching verification logs:", error);
      res.status(500).json({ message: "Failed to fetch verification logs" });
    }
  });

  // Reports API endpoints
  app.get("/api/reports/monthly-summary", requireAuth, async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const monthlyStats = await storage.getMonthlyOrderStats();
      
      // Filter by year and format the data
      const filteredStats = monthlyStats.filter(stat => {
        const statYear = new Date(stat.month + "-01").getFullYear();
        return statYear === year;
      });

      res.json(filteredStats);
    } catch (error) {
      console.error("Error fetching monthly summary:", error);
      res.status(500).json({ message: "Failed to fetch monthly summary" });
    }
  });

  app.get("/api/reports/vendor-analysis", requireAuth, async (req, res) => {
    try {
      const vendorStats = await storage.getVendorOrderStats();
      res.json(vendorStats);
    } catch (error) {
      console.error("Error fetching vendor analysis:", error);
      res.status(500).json({ message: "Failed to fetch vendor analysis" });
    }
  });

  app.get("/api/reports/cost-analysis", requireAuth, async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const orders = await storage.getPurchaseOrders({
        startDate,
        endDate,
        page: 1,
        limit: 1000
      });

      // Group by month and calculate totals
      const costAnalysis = orders.orders.reduce((acc: any[], order) => {
        const month = order.orderDate.toISOString().slice(0, 7);
        const existing = acc.find(item => item.month === month);
        
        if (existing) {
          existing.totalAmount += order.totalAmount || 0;
          existing.orderCount += 1;
        } else {
          acc.push({
            month,
            totalAmount: order.totalAmount || 0,
            orderCount: 1
          });
        }
        
        return acc;
      }, []);

      res.json(costAnalysis);
    } catch (error) {
      console.error("Error fetching cost analysis:", error);
      res.status(500).json({ message: "Failed to fetch cost analysis" });
    }
  });

  app.get("/api/reports/export-excel", requireAuth, async (req, res) => {
    try {
      const reportType = req.query.type as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      let data: any[] = [];
      let filename = "";

      switch (reportType) {
        case "monthly":
          data = await storage.getMonthlyOrderStats();
          filename = "월별_발주_현황.xlsx";
          break;
        case "vendor":
          data = await storage.getVendorOrderStats();
          filename = "거래처별_발주_통계.xlsx";
          break;
        case "orders":
          const orders = await storage.getPurchaseOrders({
            startDate,
            endDate,
            page: 1,
            limit: 1000
          });
          data = orders.orders.map(order => ({
            발주번호: order.orderNumber,
            거래처: order.vendor?.name || "",
            발주일: order.orderDate.toLocaleDateString("ko-KR"),
            납품희망일: order.deliveryDate?.toLocaleDateString("ko-KR") || "",
            총금액: order.totalAmount?.toLocaleString("ko-KR") || "0",
            상태: order.status === "pending" ? "대기" : 
                  order.status === "approved" ? "승인" : 
                  order.status === "completed" ? "완료" : order.status,
            작성자: order.user?.name || ""
          }));
          filename = "발주서_목록.xlsx";
          break;
        default:
          return res.status(400).json({ message: "Invalid report type" });
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      // Set headers for file download
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      res.status(500).json({ message: "Failed to export Excel file" });
    }
  });

  // Positions management endpoints
  app.get("/api/positions", requireAuth, async (req, res) => {
    try {
      const positions = await storage.getPositions();
      res.json(positions);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  app.get("/api/positions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const position = await storage.getPosition(id);
      if (!position) {
        return res.status(404).json({ message: "Position not found" });
      }
      res.json(position);
    } catch (error) {
      console.error("Error fetching position:", error);
      res.status(500).json({ message: "Failed to fetch position" });
    }
  });

  app.post("/api/positions", requireAuth, async (req, res) => {
    try {
      // Use the database user ID from req.user
      const user = await storage.getUser((req.user as any)?.id);
      
      console.log("Position creation request - User:", user); // Debug logging
      
      if (!user || (user.role !== "admin" && user.role !== "order_manager")) {
        return res.status(403).json({ message: "Admin or order manager access required" });
      }

      const data = insertPositionSchema.parse(req.body);
      const position = await storage.createPosition(data);
      res.status(201).json(position);
    } catch (error) {
      console.error("Error creating position:", error);
      res.status(500).json({ message: "Failed to create position" });
    }
  });

  app.patch("/api/positions/:id", async (req, res) => {
    try {
      // Skip authentication check for development
      // TODO: Re-enable proper authentication in production

      const id = parseInt(req.params.id);
      console.log("PATCH Position update request:", { id, body: req.body });
      
      const position = await storage.updatePosition(id, req.body);
      console.log("PATCH Position updated successfully:", position);
      
      res.json(position);
    } catch (error) {
      console.error("Error updating position:", error);
      res.status(500).json({ message: "Failed to update position" });
    }
  });

  app.put("/api/positions/:id", async (req, res) => {
    try {
      // Skip authentication check for development
      // TODO: Re-enable proper authentication in production

      const id = parseInt(req.params.id);
      console.log("PUT Position update request:", { id, body: req.body });
      
      const position = await storage.updatePosition(id, req.body);
      console.log("PUT Position updated successfully:", position);
      
      res.json(position);
    } catch (error) {
      console.error("Error updating position:", error);
      res.status(500).json({ message: "Failed to update position" });
    }
  });

  app.delete("/api/positions/:id", async (req, res) => {
    try {
      // Skip authentication check for development
      // TODO: Re-enable proper authentication in production

      const id = parseInt(req.params.id);
      await storage.deletePosition(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting position:", error);
      res.status(500).json({ message: "Failed to delete position" });
    }
  });

  // Seed data endpoint for development
  app.post("/api/seed-data", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser((req.user as any)?.claims?.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      await seedData();
      res.json({ message: "샘플 데이터가 성공적으로 생성되었습니다." });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ message: "샘플 데이터 생성 중 오류가 발생했습니다." });
    }
  });

  // Company management routes
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "회사 정보를 가져오는 중 오류가 발생했습니다." });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ message: "회사를 찾을 수 없습니다." });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "회사 정보를 가져오는 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다.", errors: error.errors });
      }
      res.status(500).json({ message: "회사 생성 중 오류가 발생했습니다." });
    }
  });

  app.put("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const companyData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(id, companyData);
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "입력 데이터가 올바르지 않습니다.", errors: error.errors });
      }
      res.status(500).json({ message: "회사 정보 수정 중 오류가 발생했습니다." });
    }
  });

  app.delete("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCompany(id);
      res.json({ message: "회사가 성공적으로 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "회사 삭제 중 오류가 발생했습니다." });
    }
  });

  // Company logo upload
  app.post("/api/companies/:id/logo", requireAuth, upload.single('logo'), async (req: any, res) => {
    try {
      // Get user from session - req.user should have role directly
      const user = req.user;
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "로고 파일이 제공되지 않았습니다." });
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: "지원되지 않는 파일 형식입니다. JPG, PNG, GIF 파일만 업로드 가능합니다." });
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: "파일 크기가 너무 큽니다. 5MB 이하의 파일만 업로드 가능합니다." });
      }

      const logoUrl = `/uploads/${file.filename}`;
      const company = await storage.updateCompany(id, { logoUrl });
      
      res.json({ logoUrl, company });
    } catch (error) {
      console.error("Error uploading company logo:", error);
      res.status(500).json({ message: "로고 업로드 중 오류가 발생했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
