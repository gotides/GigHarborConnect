import {
  users,
  events,
  messages,
  photos,
  profiles,
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
        .where(and(eq(messages.channel, channel), eq(messages.inappropriate, "false")));
    }
    return await db
      .select()
      .from(messages)
      .where(eq(messages.inappropriate, "false"));
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
    
    // Filter messages that contain #announcements tag
    return recentMessages.filter(message => 
      message.content.toLowerCase().includes('#announcements')
    );
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
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return profile;
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