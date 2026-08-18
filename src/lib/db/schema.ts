import {
  boolean,
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
  /** In the laundry: kept out of match suggestions until washed. */
  isDirty: boolean("is_dirty").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * A pairing the wearer chose themselves, which outranks the computed score.
 *
 * Pairings are symmetric: the two garment ids are stored in a fixed order
 * (smaller id first) so that A-with-B and B-with-A are the same row.
 */
export const favoriteMatches = pgTable("favorite_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  garmentAId: uuid("garment_a_id")
    .notNull()
    .references(() => garments.id, { onDelete: "cascade" }),
  garmentBId: uuid("garment_b_id")
    .notNull()
    .references(() => garments.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Orders a pair of garment ids so a pairing has one canonical representation. */
export function favoritePair(
  one: string,
  other: string
): { garmentAId: string; garmentBId: string } {
  return one < other
    ? { garmentAId: one, garmentBId: other }
    : { garmentAId: other, garmentBId: one };
}

export type User = typeof users.$inferSelect;
export type Garment = typeof garments.$inferSelect;
export type NewGarment = typeof garments.$inferInsert;
export type FavoriteMatch = typeof favoriteMatches.$inferSelect;

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

/**
 * A packed bag: a named subset of the wardrobe, for a trip or an occasion.
 *
 * Bags are a view over the wardrobe rather than a move — a garment in a bag
 * is still in the wardrobe, and deleting the bag leaves every garment alone.
 */
export const bags = pgTable("bags", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bagItems = pgTable("bag_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  bagId: uuid("bag_id")
    .notNull()
    .references(() => bags.id, { onDelete: "cascade" }),
  garmentId: uuid("garment_id")
    .notNull()
    .references(() => garments.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Bag = typeof bags.$inferSelect;
export type BagItem = typeof bagItems.$inferSelect;

/**
 * A reusable packing template — "ski trip", "long summer vacation".
 *
 * Distinct from a bag: a bag is one actual packing, a pack list is the
 * recipe you apply to it. Applying a list copies its garments into the bag
 * and the two stay independent afterwards.
 */
export const packLists = pgTable("pack_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const packListItems = pgTable("pack_list_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  packListId: uuid("pack_list_id")
    .notNull()
    .references(() => packLists.id, { onDelete: "cascade" }),
  garmentId: uuid("garment_id")
    .notNull()
    .references(() => garments.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PackList = typeof packLists.$inferSelect;
export type PackListItem = typeof packListItems.$inferSelect;
