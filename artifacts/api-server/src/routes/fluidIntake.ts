import { Router, type IRouter, type Request, type Response } from "express";
import { db, fluidIntakeTable, insertFluidIntakeSchema } from "@workspace/db";
import { CreateFluidIntakeBody, DeleteFluidIntakeParams } from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

function serializeIntake(r: typeof fluidIntakeTable.$inferSelect) {
  return {
    ...r,
    drinkTypes: r.drinkTypes ? JSON.parse(r.drinkTypes) : null,
  };
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(fluidIntakeTable).orderBy(desc(fluidIntakeTable.recordedAt));
    res.json(rows.map(serializeIntake));
  } catch (err) {
    req.log.error({ err }, "Failed to list fluid intake");
    res.status(500).json({ error: "Failed to fetch fluid intake records" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const bodyResult = CreateFluidIntakeBody.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: "Invalid request body", details: bodyResult.error.errors });
    return;
  }

  const { drinkTypes, ...rest } = bodyResult.data;

  const insertResult = insertFluidIntakeSchema.safeParse({
    ...rest,
    recordedAt: new Date(bodyResult.data.recordedAt),
    drinkTypes: drinkTypes ? JSON.stringify(drinkTypes) : null,
  });

  if (!insertResult.success) {
    res.status(400).json({ error: "Validation failed", details: insertResult.error.errors });
    return;
  }

  try {
    const [created] = await db.insert(fluidIntakeTable).values(insertResult.data).returning();
    res.status(201).json(serializeIntake(created));
  } catch (err) {
    req.log.error({ err }, "Failed to create fluid intake record");
    res.status(500).json({ error: "Failed to create fluid intake record" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const paramsResult = DeleteFluidIntakeParams.safeParse({ id: Number(req.params.id) });
  if (!paramsResult.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const [deleted] = await db.delete(fluidIntakeTable).where(eq(fluidIntakeTable.id, paramsResult.data.id)).returning();
    if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete fluid intake");
    res.status(500).json({ error: "Failed to delete fluid intake record" });
  }
});

export default router;
