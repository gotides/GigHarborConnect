import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, hasPermission } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertEventSchema, insertMessageSchema, insertPhotoSchema, insertProfileSchema, insertHashtagSchema, insertAccessRequestSchema, insertImportantDateSchema } from "@shared/schema";
import { format } from "date-fns";
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

// Helper function to create food scheduled announcement
async function createFoodScheduledAnnouncement(event: any, user: any) {
  try {
    const eventType = event.category === "games" ? "Game" : 
                     event.category === "team-events" ? "Team Event" : 
                     event.category === "practice" ? "Practice" : 
                     event.category === "training" ? "Training" : 
                     event.category === "team-meetings" ? "Team Meeting" : 
                     event.category === "award-ceremonies" ? "Award Ceremony" : 
                     "Event";
    
    const formattedDate = format(new Date(event.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a");
    
    let content = `#announcements 🍽️ Food has been scheduled for upcoming ${eventType}!\n\n`;
    content += `📅 **${event.title}**\n`;
    content += `🕐 ${formattedDate}\n`;
    
    if (event.location) {
      content += `📍 ${event.location}\n`;
    }
    
    content += `\n👨‍🍳 **Meal Coordinator:** ${event.mealCoordinatorName}\n`;
    if (event.mealCoordinatorEmail) {
      content += `📧 ${event.mealCoordinatorEmail}\n`;
    }
    if (event.mealCoordinatorPhone) {
      content += `📞 ${event.mealCoordinatorPhone}\n`;
    }
    if (event.mealCoordinatorLocation) {
      content += `🏠 ${event.mealCoordinatorLocation}\n`;
    }
    
    content += `\n🥗 **Ready to help with food?** Click "Signup to Provide Food" in the event details to coordinate what you'll bring!\n\n`;
    content += `Let's work together to make sure everyone is well-fed! 🎉`;

    const messageData = {
      content,
      channel: "general",
      authorName: "Tides Hub System",
      authorId: "system",
      authorInitials: "TH",
      authorColor: "hsl(210, 100%, 50%)", // Navy blue for system messages
    };

    await storage.createMessage(messageData);
    console.log("Food scheduled announcement created for event:", event.title);
  } catch (error) {
    console.error("Failed to create food scheduled announcement:", error);
  }
}

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
      
      // Auto-post announcement for events with scheduled food
      if (event.scheduleFood === "true" && event.mealCoordinatorName) {
        await createFoodScheduledAnnouncement(event, user);
      }
      
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
      
      // Check if food is being added to an existing event
      const existingEvent = await storage.getEvent(id);
      const isAddingFood = existingEvent && 
                          existingEvent.scheduleFood === "false" && 
                          validatedData.scheduleFood === "true" &&
                          validatedData.mealCoordinatorName;
      
      const event = await storage.updateEvent(id, validatedData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Auto-post announcement for newly added food scheduling
      if (isAddingFood) {
        await createFoodScheduledAnnouncement(event, undefined);
      }
      
      res.json(event);
    } catch (error) {
      console.error("Event update error:", error);
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.patch("/api/events/:id", isAuthenticated, async (req: any, res) => {
    try {
      console.log("PATCH /api/events/:id called with:", { id: req.params.id, body: req.body });
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      console.log("User:", user);
      
      if (!hasPermission(user, 'canEditEvents')) {
        console.log("Permission denied for user:", user?.role);
        return res.status(403).json({ message: "Insufficient permissions to edit events" });
      }
      
      const { foodCoordinationNotes } = req.body;
      console.log("Food coordination notes:", foodCoordinationNotes);
      
      const event = await storage.updateEvent(id, { foodCoordinationNotes });
      console.log("Updated event:", event);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Event patch error:", error);
      res.status(400).json({ message: "Invalid event data", error: (error as Error).message });
    }
  });

  app.delete("/api/events/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canDeleteEvents')) {
        return res.status(403).json({ message: "Insufficient permissions to delete events" });
      }
      
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
  app.get("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canViewMessages')) {
        return res.status(403).json({ message: "Insufficient permissions to view messages" });
      }
      
      const channel = req.query.channel as string;
      const messages = await storage.getMessages(channel);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/recent-announcements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canViewMessages')) {
        return res.status(403).json({ message: "Insufficient permissions to view announcements" });
      }
      
      const messages = await storage.getRecentAnnouncementMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent announcements" });
    }
  });

  app.get("/api/messages/admin-messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
        return res.status(403).json({ message: "Insufficient permissions to view admin messages" });
      }
      
      // Get all messages with #administrator hashtag
      const allMessages = await storage.getMessages();
      const adminMessages = allMessages
        .filter(message => 
          message.content?.includes('#administrator')
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(adminMessages);
    } catch (error) {
      console.error("Error fetching admin messages:", error);
      res.status(500).json({ message: "Failed to fetch admin messages" });
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
        authorId: userId,
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

  app.put("/api/messages/:id", isAuthenticated, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Content is required" });
      }

      const updatedMessage = await storage.updateMessage(messageId, content, userId);
      
      if (!updatedMessage) {
        return res.status(404).json({ message: "Message not found or insufficient permissions" });
      }

      res.json(updatedMessage);
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  app.delete("/api/messages/:id", isAuthenticated, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      const success = await storage.deleteMessage(messageId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Message not found or insufficient permissions" });
      }

      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Photos endpoints
  app.get("/api/photos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canViewPhotos')) {
        return res.status(403).json({ message: "Insufficient permissions to view photos" });
      }
      
      const photos = await storage.getPhotos();
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  app.post("/api/photos", isAuthenticated, upload.single('photo'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check permissions - only Administrator, Editor, and Contributor can upload photos
      if (!hasPermission(user, 'canUploadPhotos')) {
        return res.status(403).json({ message: "Insufficient permissions to upload photos" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Get uploader name from authenticated user
      const uploaderName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.firstName || user?.email?.split('@')[0] || 'User';

      const photoData = {
        title: req.body.title || req.file.originalname,
        description: req.body.description || "",
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        event: req.body.event || "",
        uploadedBy: uploaderName
      };

      const validatedData = insertPhotoSchema.parse(photoData);
      const photo = await storage.createPhoto(validatedData);
      res.status(201).json(photo);
    } catch (error) {
      console.error("Photo upload error:", error);
      res.status(400).json({ message: "Invalid photo data", error: (error as Error).message });
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

  app.delete("/api/photos/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const photo = await storage.getPhoto(id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      // Check permissions: Administrator can delete any photo, users can only delete their own photos
      const isAdmin = hasPermission(user, 'canDeletePhotos');
      const isOwner = photo.uploadedBy === (user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.firstName || user?.email?.split('@')[0] || 'User');
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Insufficient permissions to delete this photo" });
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
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
      
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      // Handle duplicate email constraint violation
      if (error.code === '23505' && error.constraint === 'users_email_key') {
        return res.status(409).json({ 
          message: "Email already exists",
          details: `This email address (${req.body.email}) is already registered. Users with this email should sign in using their existing Google/OAuth account instead of creating a manual account.`
        });
      }
      
      // Handle other database errors
      if (error.code && error.code.startsWith('23')) {
        return res.status(400).json({ 
          message: "Database constraint violation",
          details: error.message
        });
      }
      
      res.status(500).json({ message: "Failed to create user" });
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
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Profiles endpoints
  app.get("/api/profiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user has permission to view profiles (all roles except Guest)
      if (user?.role === "Guest") {
        return res.status(403).json({ message: "Insufficient permissions to view profiles" });
      }
      
      const profiles = await storage.getProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  app.get("/api/profiles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user has permission to view profiles (all roles except Guest)
      if (user?.role === "Guest") {
        return res.status(403).json({ message: "Insufficient permissions to view profiles" });
      }
      
      const targetUserId = req.params.id;
      const profile = await storage.getProfile(targetUserId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profiles", isAuthenticated, upload.single('profilePhoto'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user has permission to create/update profiles
      if (!["Administrator", "Editor", "Contributor"].includes(user?.role || "")) {
        return res.status(403).json({ message: "Insufficient permissions to manage profiles" });
      }
      
      const { name, phoneNumber, emailAddress, teamRole, playerNumber, playerName, parentPhoneNumber } = req.body;
      
      let profilePhoto = null;
      if (req.file) {
        // Generate a unique filename
        const ext = path.extname(req.file.originalname);
        const filename = `profile_${userId}_${Date.now()}${ext}`;
        const newPath = path.join(uploadDir, filename);
        
        // Move the uploaded file to the final location
        fs.renameSync(req.file.path, newPath);
        profilePhoto = filename;
      }
      
      const profileData = {
        id: userId,
        name,
        phoneNumber: phoneNumber || null,
        emailAddress,
        profilePhoto,
        teamRole: teamRole || "player",
        playerNumber: playerNumber || null,
        playerName: playerName || null,
        parentPhoneNumber: parentPhoneNumber || null,
      };
      
      // Validate the data
      const parsedData = insertProfileSchema.parse(profileData);
      
      const profile = await storage.upsertProfile(parsedData);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/profiles/:id/photo", async (req, res) => {
    try {
      const targetUserId = req.params.id;
      const profile = await storage.getProfile(targetUserId);
      
      if (!profile || !profile.profilePhoto) {
        return res.status(404).json({ message: "Profile photo not found" });
      }
      
      const filepath = path.join(uploadDir, profile.profilePhoto);
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ message: "Profile photo file not found" });
      }
      
      // Determine content type based on file extension
      const ext = path.extname(profile.profilePhoto).toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="profile_${targetUserId}${ext}"`);
      fs.createReadStream(filepath).pipe(res);
    } catch (error) {
      console.error("Error serving profile photo:", error);
      res.status(500).json({ message: "Failed to serve profile photo" });
    }
  });

  // Hashtag endpoints  
  app.get("/api/hashtags", async (req, res) => {
    try {
      const hashtags = await storage.getActiveHashtags();
      res.json(hashtags);
    } catch (error) {
      console.error("Error fetching hashtags:", error);
      res.status(500).json({ message: "Failed to fetch hashtags" });
    }
  });

  app.get("/api/admin/hashtags", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
        return res.status(403).json({ message: "Insufficient permissions to manage hashtags" });
      }
      
      const hashtags = await storage.getHashtags();
      res.json(hashtags);
    } catch (error) {
      console.error("Error fetching all hashtags:", error);
      res.status(500).json({ message: "Failed to fetch hashtags" });
    }
  });

  app.post("/api/admin/hashtags", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
        return res.status(403).json({ message: "Insufficient permissions to manage hashtags" });
      }

      const validatedData = insertHashtagSchema.parse(req.body);
      const hashtag = await storage.createHashtag(validatedData, userId);
      res.status(201).json(hashtag);
    } catch (error) {
      console.error("Error creating hashtag:", error);
      res.status(400).json({ message: "Invalid hashtag data", error: (error as Error).message });
    }
  });

  app.put("/api/admin/hashtags/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
        return res.status(403).json({ message: "Insufficient permissions to manage hashtags" });
      }

      const id = parseInt(req.params.id);
      const validatedData = insertHashtagSchema.partial().parse(req.body);
      const hashtag = await storage.updateHashtag(id, validatedData);
      
      if (!hashtag) {
        return res.status(404).json({ message: "Hashtag not found" });
      }
      
      res.json(hashtag);
    } catch (error) {
      console.error("Error updating hashtag:", error);
      res.status(400).json({ message: "Invalid hashtag data", error: (error as Error).message });
    }
  });

  app.patch("/api/admin/hashtags/:id/toggle", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
        return res.status(403).json({ message: "Insufficient permissions to manage hashtags" });
      }

      const id = parseInt(req.params.id);
      const hashtag = await storage.toggleHashtagStatus(id);
      
      if (!hashtag) {
        return res.status(404).json({ message: "Hashtag not found" });
      }
      
      res.json(hashtag);
    } catch (error) {
      console.error("Error toggling hashtag status:", error);
      res.status(500).json({ message: "Failed to toggle hashtag status" });
    }
  });

  app.delete("/api/admin/hashtags/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
        return res.status(403).json({ message: "Insufficient permissions to manage hashtags" });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHashtag(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Hashtag not found" });
      }
      
      res.json({ message: "Hashtag deleted successfully" });
    } catch (error) {
      console.error("Error deleting hashtag:", error);
      res.status(500).json({ message: "Failed to delete hashtag" });
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

  // Access request endpoints
  app.post("/api/access-requests", async (req, res) => {
    try {
      const { requesterName, requesterEmail, relationship, reason } = req.body;
      
      if (!requesterName || !requesterEmail || !relationship || !reason) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      const requestData = {
        requesterName,
        requesterEmail,
        relationship,
        reason,
        disposition: "pending",
      };
      
      const request = await storage.createAccessRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating access request:", error);
      res.status(500).json({ message: "Failed to create access request" });
    }
  });

  app.get("/api/access-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
        return res.status(403).json({ message: "Insufficient permissions to view access requests" });
      }
      
      const requests = await storage.getAccessRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching access requests:", error);
      res.status(500).json({ message: "Failed to fetch access requests" });
    }
  });

  app.patch("/api/access-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { disposition } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
        return res.status(403).json({ message: "Insufficient permissions to manage access requests" });
      }
      
      if (!['pending', 'granted', 'denied'].includes(disposition)) {
        return res.status(400).json({ message: "Invalid disposition. Must be 'pending', 'granted', or 'denied'" });
      }
      
      const request = await storage.updateAccessRequestDisposition(id, disposition, userId);
      if (!request) {
        return res.status(404).json({ message: "Access request not found" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error updating access request:", error);
      res.status(500).json({ message: "Failed to update access request" });
    }
  });

  // Important dates endpoints
  app.get("/api/important-dates", async (req, res) => {
    try {
      const dates = await storage.getImportantDates();
      res.json(dates);
    } catch (error) {
      console.error("Error fetching important dates:", error);
      res.status(500).json({ message: "Failed to fetch important dates" });
    }
  });

  app.post("/api/important-dates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
        return res.status(403).json({ message: "Insufficient permissions to manage important dates" });
      }

      const validatedData = insertImportantDateSchema.parse(req.body);
      const dateData = {
        ...validatedData,
        createdBy: userId,
      };
      
      const importantDate = await storage.createImportantDate(dateData);
      res.status(201).json(importantDate);
    } catch (error) {
      console.error("Error creating important date:", error);
      res.status(400).json({ message: "Invalid date data", error: (error as Error).message });
    }
  });

  app.put("/api/important-dates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
        return res.status(403).json({ message: "Insufficient permissions to manage important dates" });
      }

      const id = parseInt(req.params.id);
      const validatedData = insertImportantDateSchema.partial().parse(req.body);
      const importantDate = await storage.updateImportantDate(id, validatedData);
      
      if (!importantDate) {
        return res.status(404).json({ message: "Important date not found" });
      }
      
      res.json(importantDate);
    } catch (error) {
      console.error("Error updating important date:", error);
      res.status(400).json({ message: "Invalid date data", error: (error as Error).message });
    }
  });

  app.delete("/api/important-dates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canManageUsers')) {
        return res.status(403).json({ message: "Insufficient permissions to manage important dates" });
      }

      const id = parseInt(req.params.id);
      const success = await storage.deleteImportantDate(id);
      
      if (!success) {
        return res.status(404).json({ message: "Important date not found" });
      }
      
      res.json({ message: "Important date deleted successfully" });
    } catch (error) {
      console.error("Error deleting important date:", error);
      res.status(500).json({ message: "Failed to delete important date" });
    }
  });

  app.post("/api/important-dates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canCreateEvents')) {
        return res.status(403).json({ message: "Insufficient permissions to create important dates" });
      }
      
      const dateData = {
        ...req.body,
        createdBy: userId,
      };
      
      const validatedData = insertImportantDateSchema.parse(dateData);
      const date = await storage.createImportantDate(validatedData);
      res.status(201).json(date);
    } catch (error) {
      console.error("Error creating important date:", error);
      res.status(400).json({ message: "Invalid date data", error: (error as Error).message });
    }
  });

  app.put("/api/important-dates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canEditEvents')) {
        return res.status(403).json({ message: "Insufficient permissions to edit important dates" });
      }
      
      const id = parseInt(req.params.id);
      const validatedData = insertImportantDateSchema.partial().parse(req.body);
      const date = await storage.updateImportantDate(id, validatedData);
      
      if (!date) {
        return res.status(404).json({ message: "Important date not found" });
      }
      
      res.json(date);
    } catch (error) {
      console.error("Error updating important date:", error);
      res.status(400).json({ message: "Invalid date data", error: (error as Error).message });
    }
  });

  app.delete("/api/important-dates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!hasPermission(user, 'canDeleteEvents')) {
        return res.status(403).json({ message: "Insufficient permissions to delete important dates" });
      }
      
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteImportantDate(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Important date not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting important date:", error);
      res.status(500).json({ message: "Failed to delete important date" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
