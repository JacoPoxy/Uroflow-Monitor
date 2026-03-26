import { pgTable, serial, integer, boolean, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const urineColorEnum = ["clear", "pale_yellow", "yellow", "dark_yellow", "orange"] as const;
export const urgencyEnum = ["none", "mild", "moderate", "severe"] as const;
export const streamEnum = ["strong", "normal", "weak", "intermittent", "dribbling"] as const;

export const voidingsTable = pgTable("voidings", {
  id: serial("id").primaryKey(),
  voidedAt: timestamp("voided_at", { withTimezone: true }).notNull(),
  volumeMl: integer("volume_ml").notNull(),
  qmax: numeric("qmax", { precision: 5, scale: 1 }),
  durationSeconds: integer("duration_seconds"),
  urineColor: text("urine_color").notNull(),
  cloudy: boolean("cloudy").notNull().default(false),
  bloodPresent: boolean("blood_present").notNull().default(false),
  urgency: text("urgency"),
  painLevel: integer("pain_level"),
  stream: text("stream"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVoidingSchema = createInsertSchema(voidingsTable, {
  urineColor: z.enum(urineColorEnum),
  urgency: z.enum(urgencyEnum).nullable().optional(),
  stream: z.enum(streamEnum).nullable().optional(),
  painLevel: z.number().int().min(0).max(10).nullable().optional(),
  volumeMl: z.number().int().min(0),
  qmax: z.number().min(0).nullable().optional(),
  durationSeconds: z.number().int().min(0).nullable().optional(),
}).omit({ id: true, createdAt: true });

export type InsertVoiding = z.infer<typeof insertVoidingSchema>;
export type Voiding = typeof voidingsTable.$inferSelect;
