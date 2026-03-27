import { useGetReport } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Moon, BarChart2, Droplet, Activity, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";

const URGENCY_LABELS: Record<string, string> = {
  none: "None", awareness: "Awareness", urgent: "Urgent",
  highly_urgent: "Highly Urgent", sudden_onset: "Sudden Onset",
};

const URGENCY_COLORS: Record<string, string> = {
  none: "#94a3b8", awareness: "#60a5fa", urgent: "#f59e0b",
  highly_urgent: "#f97316", sudden_onset: "#ef4444",
};

export default function Report() {
  const { data: report, isLoading } = useGetReport();

  // Show last 14 days of fluid balance to keep chart readable
  const balanceData = report?.fluidBalance.slice(-14) ?? [];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">Reports & Analysis</h2>
          <p className="text-slate-500 mt-1">Fluid balance, nocturia, and urgency trends.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Fluid Balance Chart */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Cumulative Fluid Balance (Last 14 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {balanceData.length > 1 ? (
                  <div className="h-[320px] pt-6 pr-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={balanceData}>
                        <defs>
                          <linearGradient id="gIntake" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gVoided" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} dx={-6}
                          tickFormatter={v => `${Math.round(v / 1000)}L`} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                          formatter={(v: number, name: string) => [`${v} ml`, name]} />
                        <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                        <Area type="monotone" dataKey="cumulativeIntakeMl" name="Intake" stroke="#10b981" strokeWidth={2} fill="url(#gIntake)" />
                        <Area type="monotone" dataKey="cumulativeVoidedMl" name="Voided" stroke="#3b82f6" strokeWidth={2} fill="url(#gVoided)" />
                        <Area type="monotone" dataKey="netBalanceMl" name="Net Balance" stroke="#f59e0b" strokeWidth={2} fill="url(#gNet)" strokeDasharray="5 3" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400">
                    Log intake and voidings to see fluid balance trends.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nocturia */}
            <Card>
              <CardHeader className="bg-slate-50/50 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Moon className="w-5 h-5 text-indigo-500" />
                  Nocturia (Bedtime Voidings)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-indigo-50 rounded-2xl">
                    <p className="text-3xl font-bold text-indigo-700">{report?.nocturia.totalEvents ?? 0}</p>
                    <p className="text-xs font-medium text-indigo-500 mt-1">Total Events</p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-2xl">
                    <p className="text-3xl font-bold text-indigo-700">{report?.nocturia.avgPerNight ?? 0}</p>
                    <p className="text-xs font-medium text-indigo-500 mt-1">Avg / Night</p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-2xl">
                    <p className="text-3xl font-bold text-indigo-700">{report?.nocturia.nights.length ?? 0}</p>
                    <p className="text-xs font-medium text-indigo-500 mt-1">Nights Recorded</p>
                  </div>
                </div>

                {(report?.nocturia.nights.length ?? 0) > 0 && (
                  <div className="h-[200px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report?.nocturia.nights ?? []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                        <Bar dataKey="count" name="Nocturia events" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Urgency vs Volume */}
            <Card>
              <CardHeader className="bg-slate-50/50 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-5 h-5 text-amber-500" />
                  Urgency vs Average Volume Voided
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {(report?.urgencyVsVolume.length ?? 0) > 0 ? (
                  <>
                    <div className="h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={report?.urgencyVsVolume.map(u => ({ ...u, label: URGENCY_LABELS[u.urgency] ?? u.urgency })) ?? []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
                            tickFormatter={v => `${v} ml`} />
                          <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                            formatter={(v: number) => [`${v} ml avg`, "Volume"]} />
                          <Bar dataKey="avgVolumeMl" name="Avg Volume" radius={[0, 6, 6, 0]} maxBarSize={32}>
                            {report?.urgencyVsVolume.map((u, i) => (
                              <Cell key={i} fill={URGENCY_COLORS[u.urgency] ?? "#94a3b8"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-2">
                      Shows average volume voided at each urgency level. Lower urgency typically correlates with higher volumes.
                    </p>
                  </>
                ) : (
                  <div className="h-40 flex items-center justify-center text-slate-400">
                    Log more voiding events with urgency data to see this analysis.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
