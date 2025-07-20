import {
  users,
  events,
  messages,
  photos,
  profiles,
  hashtags,
  accessRequests,
  importantDates,
  type User,
  type UpsertUser,
  type Event,
  type InsertEvent,
  type Message,
  type InsertMessage,
  type Photo,
  type InsertPhoto,
  type Profile,
  type InsertProfile,
  type Hashtag,
  type InsertHashtag,
  type AccessRequest,
  type InsertAccessRequest,
  type ImportantDate,
  type InsertImportantDate,
  permissions,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc } from "drizzle-orm";

export interface IStorage {
  // User methods for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Admin user management methods
  getAllUsers(): Promise<User[]>;
  createUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Event methods
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Message methods
  getMessages(channel?: string): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, content: string, userId: string): Promise<Message | undefined>;
  deleteMessage(id: number, userId: string): Promise<boolean>;
  markMessageInappropriate(id: number): Promise<boolean>;
  getRecentAnnouncementMessages(): Promise<Message[]>;
  
  // Photo methods
  getPhotos(): Promise<Photo[]>;
  getPhoto(id: number): Promise<Photo | undefined>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number): Promise<boolean>;
  
  // Profile methods
  getProfiles(): Promise<Profile[]>;
  getProfile(userId: string): Promise<Profile | undefined>;
  upsertProfile(profile: InsertProfile): Promise<Profile>;
  
  // Hashtag methods
  getHashtags(): Promise<Hashtag[]>;
  getActiveHashtags(): Promise<Hashtag[]>;
  createHashtag(hashtag: InsertHashtag, userId: string): Promise<Hashtag>;
  updateHashtag(id: number, hashtag: Partial<InsertHashtag>): Promise<Hashtag | undefined>;
  deleteHashtag(id: number): Promise<boolean>;
  toggleHashtagStatus(id: number): Promise<Hashtag | undefined>;
  
  // Access request methods
  getAccessRequests(): Promise<AccessRequest[]>;
  createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  updateAccessRequestDisposition(id: number, disposition: string, processedBy: string): Promise<AccessRequest | undefined>;
  
  // Important dates methods
  getImportantDates(): Promise<ImportantDate[]>;
  getImportantDate(id: number): Promise<ImportantDate | undefined>;
  createImportantDate(date: InsertImportantDate): Promise<ImportantDate>;
  updateImportantDate(id: number, date: Partial<InsertImportantDate>): Promise<ImportantDate | undefined>;
  deleteImportantDate(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Admin user management methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Event methods
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }

  async updateEvent(id: number, updateData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db
      .delete(events)
      .where(eq(events.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Message methods
  async getMessages(channel?: string): Promise<Message[]> {
    if (channel) {
      return await db
        .select()
        .from(messages)
        .where(and(eq(messages.channel, channel), eq(messages.inappropriate, "false")))
        .orderBy(messages.createdAt);
    }
    return await db
      .select()
      .from(messages)
      .where(eq(messages.inappropriate, "false"))
      .orderBy(messages.createdAt);
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async updateMessage(id: number, content: string, userId: string): Promise<Message | undefined> {
    // First check if the user is the author or has admin permissions
    const [existingMessage] = await db.select().from(messages).where(eq(messages.id, id));
    if (!existingMessage) return undefined;
    
    // Get user to check permissions
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Allow if user is the author or has admin permissions
    const canEdit = existingMessage.authorId === userId || hasPermission(user, 'canEditMessages');
    if (!canEdit) return undefined;
    
    const [updatedMessage] = await db
      .update(messages)
      .set({ 
        content,
        editedAt: new Date()
      })
      .where(eq(messages.id, id))
      .returning();
    
    return updatedMessage || undefined;
  }

  async deleteMessage(id: number, userId: string): Promise<boolean> {
    // First check if the user is the author or has admin permissions
    const [existingMessage] = await db.select().from(messages).where(eq(messages.id, id));
    if (!existingMessage) return false;
    
    // Get user to check permissions
    const user = await this.getUser(userId);
    if (!user) return false;
    
    // Allow if user is the author or has admin permissions
    const canDelete = existingMessage.authorId === userId || hasPermission(user, 'canDeleteMessages');
    if (!canDelete) return false;
    
    const result = await db
      .delete(messages)
      .where(eq(messages.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  async markMessageInappropriate(id: number): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ inappropriate: "true" })
      .where(eq(messages.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getRecentAnnouncementMessages(): Promise<Message[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.inappropriate, "false"),
          gte(messages.createdAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(10);
    
    // Filter messages that contain #announcements tag and remove the hashtag from content
    return recentMessages
      .filter(message => message.content.toLowerCase().includes('#announcements'))
      .map(message => ({
        ...message,
        content: message.content.replace(/#announcements/g, '').trim()
      }));
  }

  // Photo methods
  async getPhotos(): Promise<Photo[]> {
    return await db.select().from(photos);
  }

  async getPhoto(id: number): Promise<Photo | undefined> {
    const [photo] = await db.select().from(photos).where(eq(photos.id, id));
    return photo || undefined;
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const [photo] = await db
      .insert(photos)
      .values(insertPhoto)
      .returning();
    return photo;
  }

  async deletePhoto(id: number): Promise<boolean> {
    const result = await db
      .delete(photos)
      .where(eq(photos.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Profile methods
  async getProfiles(): Promise<Profile[]> {
    return await db.select().from(profiles);
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
    return profile || undefined;
  }

  async upsertProfile(insertProfile: InsertProfile): Promise<Profile> {
    // Get existing profile to preserve photo if no new photo provided
    let existingProfile: Profile | undefined;
    try {
      existingProfile = await this.getProfile(insertProfile.id);
    } catch (e) {
      // Profile doesn't exist yet, that's fine
    }
    
    // If no new photo provided, keep existing photo
    const finalProfilePhoto = insertProfile.profilePhoto || existingProfile?.profilePhoto || null;
    
    const [profile] = await db
      .insert(profiles)
      .values({
        ...insertProfile,
        profilePhoto: finalProfilePhoto,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          name: insertProfile.name,
          phoneNumber: insertProfile.phoneNumber,
          emailAddress: insertProfile.emailAddress,
          profilePhoto: finalProfilePhoto,
          teamRole: insertProfile.teamRole,
          playerNumber: insertProfile.playerNumber,
          playerName: insertProfile.playerName,
          parentPhoneNumber: insertProfile.parentPhoneNumber,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return profile;
  }

  // Hashtag methods
  async getHashtags(): Promise<Hashtag[]> {
    return await db.select().from(hashtags).orderBy(hashtags.name);
  }

  async getActiveHashtags(): Promise<Hashtag[]> {
    return await db.select().from(hashtags)
      .where(eq(hashtags.isActive, "true"))
      .orderBy(hashtags.name);
  }

  async createHashtag(insertHashtag: InsertHashtag, userId: string): Promise<Hashtag> {
    const [hashtag] = await db
      .insert(hashtags)
      .values({
        ...insertHashtag,
        createdBy: userId,
      })
      .returning();
    return hashtag;
  }

  async updateHashtag(id: number, updateData: Partial<InsertHashtag>): Promise<Hashtag | undefined> {
    const [hashtag] = await db
      .update(hashtags)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(hashtags.id, id))
      .returning();
    return hashtag;
  }

  async deleteHashtag(id: number): Promise<boolean> {
    const result = await db
      .delete(hashtags)
      .where(eq(hashtags.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async toggleHashtagStatus(id: number): Promise<Hashtag | undefined> {
    // First get the current status
    const [currentHashtag] = await db.select().from(hashtags).where(eq(hashtags.id, id));
    if (!currentHashtag) return undefined;

    const newStatus = currentHashtag.isActive === "true" ? "false" : "true";
    
    const [hashtag] = await db
      .update(hashtags)
      .set({
        isActive: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(hashtags.id, id))
      .returning();
    return hashtag;
  }

  // Access request methods
  async getAccessRequests(): Promise<AccessRequest[]> {
    return await db.select().from(accessRequests).orderBy(desc(accessRequests.createdAt));
  }

  async createAccessRequest(insertRequest: InsertAccessRequest): Promise<AccessRequest> {
    const [request] = await db
      .insert(accessRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async updateAccessRequestDisposition(id: number, disposition: string, processedBy: string): Promise<AccessRequest | undefined> {
    const [request] = await db
      .update(accessRequests)
      .set({
        disposition,
        processedBy,
        processedAt: new Date(),
      })
      .where(eq(accessRequests.id, id))
      .returning();
    return request;
  }

  // Important dates methods
  async getImportantDates(): Promise<ImportantDate[]> {
    return await db.select().from(importantDates).orderBy(desc(importantDates.date));
  }

  async getImportantDate(id: number): Promise<ImportantDate | undefined> {
    const [date] = await db.select().from(importantDates).where(eq(importantDates.id, id));
    return date;
  }

  async createImportantDate(dateData: InsertImportantDate): Promise<ImportantDate> {
    const [date] = await db.insert(importantDates).values(dateData).returning();
    return date;
  }

  async updateImportantDate(id: number, dateData: Partial<InsertImportantDate>): Promise<ImportantDate | undefined> {
    const [date] = await db
      .update(importantDates)
      .set(dateData)
      .where(eq(importantDates.id, id))
      .returning();
    return date;
  }

  async deleteImportantDate(id: number): Promise<boolean> {
    const result = await db.delete(importantDates).where(eq(importantDates.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();

// Helper function to check user permissions
export function hasPermission(user: User | undefined, permission: keyof typeof permissions[keyof typeof permissions]): boolean {
  console.log('hasPermission called with:', { user, permission });
  
  if (!user) {
    console.log('hasPermission: No user provided');
    return false;
  }
  
  const userRole = user.role as keyof typeof permissions;
  console.log('hasPermission: User role:', userRole);
  console.log('hasPermission: Available permissions for role:', permissions[userRole]);
  console.log('hasPermission: Checking permission:', permission);
  
  const result = permissions[userRole]?.[permission] || false;
  console.log('hasPermission result:', result);
  
  return result;
}

// Helper function to get user's role
export function getUserRole(user: User | undefined): string {
  return user?.role || "guest";
}