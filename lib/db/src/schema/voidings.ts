import { pgTable, serial, integer, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const urineColorEnum = ["pale_yellow", "yellow", "dark_yellow", "amber", "orange", "pink", "red", "brown", "clear", "other"] as const;
export const cloudinessEnum = ["clear", "slightly_cloudy", "cloudy", "very_cloudy"] as const;
export const urgencyEnum = ["none", "mild", "moderate", "severe"] as const;
export const streamEnum = ["strong", "normal", "weak", "intermittent", "dribbling"] as const;

export const voidingsTable = pgTable("voidings", {
  id: serial("id").primaryKey(),
  voidedAt: timestamp("voided_at", { withTimezone: true }).notNull(),
  volumeMl: integer("volume_ml").notNull(),
  durationSeconds: integer("duration_seconds"),
  urineColor: text("urine_color").notNull(),
  cloudiness: text("cloudiness").notNull(),
  bloodPresent: boolean("blood_present").notNull().default(false),
  urgency: text("urgency"),
  painLevel: integer("pain_level"),
  stream: text("stream"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVoidingSchema = createInsertSchema(voidingsTable, {
  urineColor: z.enum(urineColorEnum),
  cloudiness: z.enum(cloudinessEnum),
  urgency: z.enum(urgencyEnum).nullable().optional(),
  stream: z.enum(streamEnum).nullable().optional(),
  painLevel: z.number().int().min(0).max(10).nullable().optional(),
  volumeMl: z.number().int().min(0),
  durationSeconds: z.number().int().min(0).nullable().optional(),
}).omit({ id: true, createdAt: true });

export type InsertVoiding = z.infer<typeof insertVoidingSchema>;
export type Voiding = typeof voidingsTable.$inferSelect;
