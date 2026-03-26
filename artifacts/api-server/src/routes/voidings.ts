import { Router, type IRouter, type Request, type Response } from "express";
import { db, voidingsTable } from "@workspace/db";
import { insertVoidingSchema } from "@workspace/db";
import { CreateVoidingBody, GetVoidingParams, DeleteVoidingParams } from "@workspace/api-zod";
import { eq, desc, gte, sql, count, avg, sum } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats/summary", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalResult] = await db.select({ count: count() }).from(voidingsTable);
    const totalRecords = totalResult?.count ?? 0;

    const statsForPeriod = async (since: Date) => {
      const [row] = await db
        .select({
          count: count(),
          avgVolumeMl: avg(voidingsTable.volumeMl),
          totalVolumeMl: sum(voidingsTable.volumeMl),
          avgDurationSeconds: avg(voidingsTable.durationSeconds),
          bloodIncidents: sql<number>`SUM(CASE WHEN ${voidingsTable.bloodPresent} THEN 1 ELSE 0 END)::int`,
        })
        .from(voidingsTable)
        .where(gte(voidingsTable.voidedAt, since));

      return {
        count: row?.count ?? 0,
        avgVolumeMl: row?.avgVolumeMl ? parseFloat(String(row.avgVolumeMl)) : null,
        totalVolumeMl: row?.totalVolumeMl ? parseInt(String(row.totalVolumeMl)) : 0,
        avgDurationSeconds: row?.avgDurationSeconds ? parseFloat(String(row.avgDurationSeconds)) : null,
        bloodIncidents: row?.bloodIncidents ?? 0,
      };
    };

    const [last7Days, last30Days] = await Promise.all([
      statsForPeriod(sevenDaysAgo),
      statsForPeriod(thirtyDaysAgo),
    ]);

    res.json({ last7Days, last30Days, totalRecords });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch voiding stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const voidings = await db
      .select()
      .from(voidingsTable)
      .orderBy(desc(voidingsTable.voidedAt));
    res.json(voidings);
  } catch (err) {
    req.log.error({ err }, "Failed to list voidings");
    res.status(500).json({ error: "Failed to fetch voiding records" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const bodyResult = CreateVoidingBody.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: "Invalid request body", details: bodyResult.error.errors });
    return;
  }

  const insertResult = insertVoidingSchema.safeParse({
    ...bodyResult.data,
    voidedAt: new Date(bodyResult.data.voidedAt),
    qmax: bodyResult.data.qmax != null ? String(bodyResult.data.qmax) : null,
  });
  if (!insertResult.success) {
    res.status(400).json({ error: "Validation failed", details: insertResult.error.errors });
    return;
  }

  try {
    const [created] = await db.insert(voidingsTable).values(insertResult.data).returning();
    // Convert qmax back to number for response
    res.status(201).json({
      ...created,
      qmax: created.qmax != null ? parseFloat(String(created.qmax)) : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create voiding record");
    res.status(500).json({ error: "Failed to create voiding record" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const paramsResult = GetVoidingParams.safeParse({ id: Number(req.params.id) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    const [voiding] = await db
      .select()
      .from(voidingsTable)
      .where(eq(voidingsTable.id, paramsResult.data.id));

    if (!voiding) {
      res.status(404).json({ error: "Voiding record not found" });
      return;
    }

    res.json({
      ...voiding,
      qmax: voiding.qmax != null ? parseFloat(String(voiding.qmax)) : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get voiding");
    res.status(500).json({ error: "Failed to fetch voiding record" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const paramsResult = DeleteVoidingParams.safeParse({ id: Number(req.params.id) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    const [deleted] = await db
      .delete(voidingsTable)
      .where(eq(voidingsTable.id, paramsResult.data.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Voiding record not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete voiding");
    res.status(500).json({ error: "Failed to delete voiding record" });
  }
});

export default router;
