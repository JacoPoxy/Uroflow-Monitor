import { pgTable, serial, integer, boolean, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const urineColorEnum = ["pale_yellow", "yellow", "dark_yellow", "orange", "dark_orange"] as const;
export const hematuriaEnum = ["none", "visible_hematuria", "post_drops", "post_pink"] as const;
export const urgencyEnum = ["none", "awareness", "urgent", "highly_urgent", "sudden_onset"] as const;
export const streamEnum = ["strong", "normal", "weak", "intermittent", "dribbling"] as const;
export const painLocationEnum = ["spasm", "perineum", "shaft", "tip"] as const;
export const appearanceTagEnum = ["clots", "flakes", "specks"] as const;

export const voidingsTable = pgTable("voidings", {
  id: serial("id").primaryKey(),
  voidedAt: timestamp("voided_at", { withTimezone: true }).notNull(),
  volumeMl: integer("volume_ml").notNull(),
  qmax: numeric("qmax", { precision: 5, scale: 1 }),
  durationSeconds: integer("duration_seconds"),
  urineColor: text("urine_color").notNull(),
  cloudy: boolean("cloudy").notNull().default(false),
  appearanceTags: text("appearance_tags"),
  hematuria: text("hematuria").notNull().default("none"),
  urgency: text("urgency"),
  painLocations: text("pain_locations"),
  stream: text("stream"),
  isNocturia: boolean("is_nocturia").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVoidingSchema = createInsertSchema(voidingsTable, {
  urineColor: z.enum(urineColorEnum),
  hematuria: z.enum(hematuriaEnum),
  urgency: z.enum(urgencyEnum).nullable().optional(),
  stream: z.enum(streamEnum).nullable().optional(),
  painLocations: z.string().nullable().optional(),
  appearanceTags: z.string().nullable().optional(),
  volumeMl: z.number().int().min(0),
  qmax: z.number().min(0).nullable().optional(),
  durationSeconds: z.number().int().min(0).nullable().optional(),
}).omit({ id: true, createdAt: true });

export type InsertVoiding = z.infer<typeof insertVoidingSchema>;
export type Voiding = typeof voidingsTable.$inferSelect;
