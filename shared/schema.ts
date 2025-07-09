import { pgTable, text, serial, integer, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth with roles
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // Replit user ID
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("guest"), // administrator, editor, contributor, viewer, guest
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  category: text("category").notNull().default("games"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  channel: text("channel").notNull().default("general"),
  authorName: text("author_name").notNull(),
  authorInitials: text("author_initials").notNull(),
  authorColor: text("author_color").notNull(),
  inappropriate: text("inappropriate").notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  event: text("event"),
  uploadedBy: text("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().references(() => users.id),
  name: text("name").notNull(),
  phoneNumber: text("phoneNumber"),
  emailAddress: text("emailAddress").notNull(),
  profilePhoto: text("profilePhoto"),
  teamRole: text("teamRole").notNull().default("player"), // player, coach, parent
  playerNumber: text("playerNumber"), // only for players
  playerName: text("playerName"), // only for players
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Role definitions
export const roles = {
  ADMINISTRATOR: "Administrator",
  EDITOR: "Editor", 
  CONTRIBUTOR: "Contributor",
  VIEWER: "Viewer",
  GUEST: "Guest"
} as const;

export type UserRole = typeof roles[keyof typeof roles];

// Permission matrix for role-based access control
export const permissions = {
  [roles.ADMINISTRATOR]: {
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: true,
    canViewEvents: true,
    canCreateMessages: true,
    canEditMessages: true,
    canDeleteMessages: true,
    canFlagMessages: true,
    canViewMessages: true,
    canUploadPhotos: true,
    canDeletePhotos: true,
    canViewPhotos: true,
    canManageUsers: true,
  },
  [roles.EDITOR]: {
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: false,
    canViewEvents: true,
    canCreateMessages: true,
    canEditMessages: false,
    canDeleteMessages: false,
    canFlagMessages: true,
    canViewMessages: true,
    canUploadPhotos: true,
    canDeletePhotos: false,
    canViewPhotos: true,
    canManageUsers: false,
  },
  [roles.CONTRIBUTOR]: {
    canCreateEvents: true,
    canEditEvents: false,
    canDeleteEvents: false,
    canViewEvents: true,
    canCreateMessages: true,
    canEditMessages: false,
    canDeleteMessages: false,
    canFlagMessages: false,
    canViewMessages: true,
    canUploadPhotos: true,
    canDeletePhotos: false,
    canViewPhotos: true,
    canManageUsers: false,
  },
  [roles.VIEWER]: {
    canCreateEvents: false,
    canEditEvents: false,
    canDeleteEvents: false,
    canViewEvents: true,
    canCreateMessages: true,
    canEditMessages: false,
    canDeleteMessages: false,
    canFlagMessages: false,
    canViewMessages: true,
    canUploadPhotos: false,
    canDeletePhotos: false,
    canViewPhotos: true,
    canManageUsers: false,
  },
  [roles.GUEST]: {
    canCreateEvents: false,
    canEditEvents: false,
    canDeleteEvents: false,
    canViewEvents: false,
    canCreateMessages: false,
    canEditMessages: false,
    canDeleteMessages: false,
    canFlagMessages: false,
    canViewMessages: false,
    canUploadPhotos: false,
    canDeletePhotos: false,
    canViewPhotos: false,
    canManageUsers: false,
  },
};

// Updated schemas for Replit Auth
export const upsertUserSchema = createInsertSchema(users);

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdBy: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  inappropriate: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  uploadedAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  teamRole: z.enum(["player", "coach", "parent"]).default("player"),
  playerNumber: z.string().optional().nullable(),
  playerName: z.string().optional().nullable(),
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
