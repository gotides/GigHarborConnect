import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, hasPermission } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertEventSchema, insertMessageSchema, insertPhotoSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Events endpoints
  app.get("/api/events", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Debug logging
      console.log('GET /api/events - User ID:', userId);
      console.log('GET /api/events - User object:', user);
      console.log('GET /api/events - User role:', user?.role);
      console.log('GET /api/events - hasPermission result:', hasPermission(user, 'canViewEvents'));
      
      if (!hasPermission(user, 'canViewEvents')) {
        console.log('GET /api/events - Permission denied for user:', user);
        return res.status(403).json({ message: "Insufficient permissions to view events" });
      }
      
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canViewEvents')) {
        return res.status(403).json({ message: "Insufficient permissions to view events" });
      }
      
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canCreateEvents')) {
        return res.status(403).json({ message: "Insufficient permissions to create events" });
      }
      
      // Transform date strings to Date objects
      const eventData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        createdBy: userId
      };
      
      const validatedData = insertEventSchema.parse(eventData);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Event creation error:", error);
      res.status(400).json({ message: "Invalid event data", error: (error as Error).message });
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Transform date strings to Date objects
      const eventData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };
      
      const validatedData = insertEventSchema.partial().parse(eventData);
      const event = await storage.updateEvent(id, validatedData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Event update error:", error);
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEvent(id);
      if (!deleted) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Messages endpoints
  app.get("/api/messages", async (req, res) => {
    try {
      const channel = req.query.channel as string;
      const messages = await storage.getMessages(channel);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Debug logging
      console.log('POST /api/messages - User ID:', userId);
      console.log('POST /api/messages - User object:', user);
      console.log('POST /api/messages - User role:', user?.role);
      console.log('POST /api/messages - hasPermission result:', hasPermission(user, 'canCreateMessages'));
      
      if (!hasPermission(user, 'canCreateMessages')) {
        console.log('POST /api/messages - Permission denied for user:', user);
        return res.status(403).json({ message: "Insufficient permissions to send messages" });
      }
      
      // Add user information to message
      const authorName = user?.firstName || user?.email?.split('@')[0] || 'User';
      
      // Debug logging
      console.log('User object:', user);
      console.log('Author name:', authorName);
      
      const messageData = {
        ...req.body,
        authorName: authorName,
        authorInitials: authorName.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2),
        authorColor: `hsl(${(authorName.length * 137) % 360}, 70%, 50%)`
      };
      
      console.log('Message data:', messageData);
      
      const validatedData = insertMessageSchema.parse(messageData);
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Message creation error:", error);
      res.status(400).json({ message: "Invalid message data", error: (error as Error).message });
    }
  });

  app.patch("/api/messages/:id/inappropriate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markMessageInappropriate(id);
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }
      res.status(200).json({ message: "Message marked as inappropriate" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as inappropriate" });
    }
  });

  // Photos endpoints
  app.get("/api/photos", async (req, res) => {
    try {
      const photos = await storage.getPhotos();
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  app.post("/api/photos", upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const photoData = {
        title: req.body.title || req.file.originalname,
        description: req.body.description || "",
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        event: req.body.event || "",
        uploadedBy: req.body.uploadedBy || "Anonymous"
      };

      const validatedData = insertPhotoSchema.parse(photoData);
      const photo = await storage.createPhoto(validatedData);
      res.status(201).json(photo);
    } catch (error) {
      res.status(400).json({ message: "Invalid photo data" });
    }
  });

  app.get("/api/photos/:id/file", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const photo = await storage.getPhoto(id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      const filepath = path.join(uploadDir, photo.filename);
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ message: "Photo file not found" });
      }

      res.setHeader('Content-Type', photo.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${photo.originalName}"`);
      fs.createReadStream(filepath).pipe(res);
    } catch (error) {
      res.status(500).json({ message: "Failed to serve photo" });
    }
  });

  app.delete("/api/photos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const photo = await storage.getPhoto(id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      // Delete file from disk
      const filepath = path.join(uploadDir, photo.filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }

      const deleted = await storage.deletePhoto(id);
      if (!deleted) {
        return res.status(404).json({ message: "Photo not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
        return res.status(403).json({ message: "Insufficient permissions to manage users" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      console.log("POST /api/admin/users - Request body:", req.body);
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      console.log("POST /api/admin/users - User:", user);
      
      if (!hasPermission(user, 'canManageUsers')) {
        console.log("POST /api/admin/users - Permission denied");
        return res.status(403).json({ message: "Insufficient permissions to manage users" });
      }
      
      // Generate a unique ID for the new user (for manual creation)
      const newUserId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      const userData = {
        id: newUserId,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role,
        profileImageUrl: null
      };
      
      console.log("POST /api/admin/users - Creating user with data:", userData);
      
      const newUser = await storage.createUser(userData);
      console.log("POST /api/admin/users - User created:", newUser);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("POST /api/admin/users - Error creating user:", error);
      console.error("POST /api/admin/users - Error stack:", error.stack);
      res.status(500).json({ message: "Failed to create user", error: error.message });
    }
  });

  app.patch("/api/admin/users/:id/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
        return res.status(403).json({ message: "Insufficient permissions to manage users" });
      }
      
      const targetUserId = req.params.id;
      const { role } = req.body;
      
      // Prevent user from demoting themselves if they're the last admin
      if (targetUserId === userId && role !== "Administrator") {
        const allUsers = await storage.getAllUsers();
        const adminCount = allUsers.filter(u => u.role === "Administrator").length;
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Cannot demote the last administrator" });
        }
      }
      
      const updatedUser = await storage.updateUserRole(targetUserId, role);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
        return res.status(403).json({ message: "Insufficient permissions to manage users" });
      }
      
      const targetUserId = req.params.id;
      
      // Prevent user from deleting themselves
      if (targetUserId === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      // Check if target user is the last admin
      const targetUser = await storage.getUser(targetUserId);
      if (targetUser?.role === "Administrator") {
        const allUsers = await storage.getAllUsers();
        const adminCount = allUsers.filter(u => u.role === "Administrator").length;
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Cannot delete the last administrator" });
        }
      }
      
      const deleted = await storage.deleteUser(targetUserId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    const filepath = path.join(uploadDir, req.path);
    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
