import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const drinkTypeEnum = ["caffeine", "fizzy", "acidic", "alcohol", "neutral"] as const;

export const fluidIntakeTable = pgTable("fluid_intake", {
  id: serial("id").primaryKey(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
  volumeMl: integer("volume_ml").notNull(),
  drinkTypes: text("drink_types"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFluidIntakeSchema = createInsertSchema(fluidIntakeTable, {
  volumeMl: z.number().int().min(0),
  drinkTypes: z.string().nullable().optional(),
}).omit({ id: true, createdAt: true });

export type InsertFluidIntake = z.infer<typeof insertFluidIntakeSchema>;
export type FluidIntake = typeof fluidIntakeTable.$inferSelect;
