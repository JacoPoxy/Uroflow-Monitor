import { Router, type IRouter, type Request, type Response } from "express";
import { db, voidingsTable, fluidIntakeTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { format, subDays, parseISO, startOfDay } from "date-fns";

const router: IRouter = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const [voidings, intakes] = await Promise.all([
      db.select().from(voidingsTable).orderBy(desc(voidingsTable.voidedAt)),
      db.select().from(fluidIntakeTable).orderBy(desc(fluidIntakeTable.recordedAt)),
    ]);

    // ---- Fluid Balance (daily, last 30 days) ----
    const dayMap: Record<string, { intakeMl: number; voidedMl: number }> = {};

    // Pre-fill the last 30 days so days with no data still appear
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");
      dayMap[d] = { intakeMl: 0, voidedMl: 0 };
    }

    for (const v of voidings) {
      const d = format(new Date(v.voidedAt), "MMM d");
      if (dayMap[d] !== undefined) dayMap[d].voidedMl += v.volumeMl;
    }
    for (const f of intakes) {
      const d = format(new Date(f.recordedAt), "MMM d");
      if (dayMap[d] !== undefined) dayMap[d].intakeMl += f.volumeMl;
    }

    let cumulativeIntake = 0;
    let cumulativeVoided = 0;
    const fluidBalance = Object.entries(dayMap).map(([date, { intakeMl, voidedMl }]) => {
      cumulativeIntake += intakeMl;
      cumulativeVoided += voidedMl;
      return {
        date,
        cumulativeIntakeMl: cumulativeIntake,
        cumulativeVoidedMl: cumulativeVoided,
        netBalanceMl: cumulativeIntake - cumulativeVoided,
      };
    });

    // ---- Nocturia ----
    const nocturiaEvents = voidings.filter(v => v.isNocturia);
    const nightMap: Record<string, number> = {};
    for (const v of nocturiaEvents) {
      const night = format(startOfDay(new Date(v.voidedAt)), "MMM d");
      nightMap[night] = (nightMap[night] ?? 0) + 1;
    }
    const nights = Object.entries(nightMap).map(([date, count]) => ({ date, count }));
    const avgPerNight = nights.length > 0
      ? nights.reduce((s, n) => s + n.count, 0) / nights.length
      : 0;

    const nocturia = {
      totalEvents: nocturiaEvents.length,
      avgPerNight: Math.round(avgPerNight * 10) / 10,
      nights,
    };

    // ---- Urgency vs Volume ----
    const urgencyMap: Record<string, { total: number; count: number }> = {};
    for (const v of voidings) {
      const u = v.urgency ?? "none";
      if (!urgencyMap[u]) urgencyMap[u] = { total: 0, count: 0 };
      urgencyMap[u].total += v.volumeMl;
      urgencyMap[u].count += 1;
    }

    const urgencyOrder = ["none", "awareness", "urgent", "highly_urgent", "sudden_onset"];
    const urgencyVsVolume = urgencyOrder
      .filter(u => urgencyMap[u] && urgencyMap[u].count > 0)
      .map(u => ({
        urgency: u,
        avgVolumeMl: Math.round(urgencyMap[u].total / urgencyMap[u].count),
        count: urgencyMap[u].count,
      }));

    res.json({ fluidBalance, nocturia, urgencyVsVolume });
  } catch (err) {
    req.log.error({ err }, "Failed to generate report");
    res.status(500).json({ error: "Failed to generate report" });
  }
});

export default router;
