import { useGetVoidingStats, useListVoidings, getListVoidingsQueryKey, getGetVoidingStatsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Droplet, Clock, AlertCircle, Calendar } from "lucide-react";
import { formatClinicalDateTime } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetVoidingStats();
  const { data: voidings, isLoading: listLoading } = useListVoidings();

  // Prepare chart data from recent voidings
  const chartData = voidings?.slice(0, 14).reverse().map(v => ({
    time: format(parseISO(v.voidedAt), "MMM d, HH:mm"),
    volume: v.volumeMl,
  })) || [];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">Patient Dashboard</h2>
          <p className="text-slate-500 mt-1">Overview of your voiding history and metrics.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <CardContent className="p-5 flex flex-col items-center text-center justify-center h-full">
              <div className="bg-blue-100 p-3 rounded-full mb-3 text-blue-600">
                <Activity className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">7-Day Events</p>
              <h3 className="text-3xl font-display font-bold text-slate-800">
                {statsLoading ? "-" : stats?.last7Days.count || 0}
              </h3>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-sky-50 to-white border-sky-100">
            <CardContent className="p-5 flex flex-col items-center text-center justify-center h-full">
              <div className="bg-sky-100 p-3 rounded-full mb-3 text-sky-600">
                <Droplet className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Avg Volume (7d)</p>
              <h3 className="text-3xl font-display font-bold text-slate-800 flex items-baseline gap-1">
                {statsLoading ? "-" : Math.round(stats?.last7Days.avgVolumeMl || 0)}
                <span className="text-base text-slate-500 font-medium">ml</span>
              </h3>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
            <CardContent className="p-5 flex flex-col items-center text-center justify-center h-full">
              <div className="bg-indigo-100 p-3 rounded-full mb-3 text-indigo-600">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Avg Duration (7d)</p>
              <h3 className="text-3xl font-display font-bold text-slate-800 flex items-baseline gap-1">
                {statsLoading ? "-" : Math.round(stats?.last7Days.avgDurationSeconds || 0)}
                <span className="text-base text-slate-500 font-medium">sec</span>
              </h3>
            </CardContent>
          </Card>

          <Card className={stats?.last7Days.bloodIncidents ? "bg-gradient-to-br from-red-50 to-white border-red-200" : "bg-gradient-to-br from-slate-50 to-white border-slate-100"}>
            <CardContent className="p-5 flex flex-col items-center text-center justify-center h-full">
              <div className={stats?.last7Days.bloodIncidents ? "bg-red-100 p-3 rounded-full mb-3 text-red-600 animate-pulse" : "bg-slate-200 p-3 rounded-full mb-3 text-slate-500"}>
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Blood Events (7d)</p>
              <h3 className="text-3xl font-display font-bold text-slate-800">
                {statsLoading ? "-" : stats?.last7Days.bloodIncidents || 0}
              </h3>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Volume Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {chartData.length > 0 ? (
              <div className="h-[300px] w-full pt-6 pr-6 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: 'hsl(var(--foreground))', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="volume" 
                      name="Volume (ml)"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorVolume)" 
                      activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 gap-4">
                {/* empty state clipboard illustration */}
                <img 
                  src={`${import.meta.env.BASE_URL}images/empty-state-clipboard.png`}
                  alt="No data"
                  className="w-32 h-32 opacity-50 drop-shadow-md grayscale"
                />
                <p>Not enough data to display chart.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Entries preview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              Recent Entries
            </h3>
            <Link href="/history" className="text-sm font-semibold text-primary hover:underline">
              View All
            </Link>
          </div>
          
          <div className="grid gap-3">
            {listLoading ? (
              <div className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>
            ) : voidings?.slice(0, 3).map((item) => (
              <Card key={item.id} className="group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex flex-col items-center justify-center border border-slate-100 shadow-sm text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="text-sm font-bold leading-none">{item.volumeMl}</span>
                      <span className="text-[10px] font-medium opacity-80">ml</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">
                        {formatClinicalDateTime(item.voidedAt)}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] capitalize bg-slate-50">
                          {item.urineColor.replace('_', ' ')}
                        </Badge>
                        {item.bloodPresent && (
                          <Badge variant="destructive" className="text-[10px] uppercase tracking-wider font-bold">
                            Blood
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {item.durationSeconds && (
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-slate-600">{item.durationSeconds} sec</p>
                      <p className="text-xs text-slate-400">Duration</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {voidings?.length === 0 && (
              <div className="text-center p-8 border-2 border-dashed border-border rounded-2xl text-slate-500">
                No voiding events recorded yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
