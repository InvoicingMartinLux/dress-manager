import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type GarmentColor = { name: string; hex: string };

export const garments = pgTable("garments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  colors: jsonb("colors").$type<GarmentColor[]>().notNull().default([]),
  pattern: text("pattern").notNull().default("solid"),
  formality: integer("formality").notNull().default(3),
  seasons: jsonb("seasons").$type<string[]>().notNull().default([]),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Garment = typeof garments.$inferSelect;
export type NewGarment = typeof garments.$inferInsert;

export const CATEGORIES = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "shoes",
  "accessory",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const PATTERNS = [
  "solid",
  "striped",
  "checked",
  "floral",
  "graphic",
  "other",
] as const;

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
