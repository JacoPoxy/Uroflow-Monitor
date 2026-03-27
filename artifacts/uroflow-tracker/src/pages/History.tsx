import { useListVoidings, useListFluidIntake, useDeleteVoiding, useDeleteFluidIntake, getListVoidingsQueryKey, getGetVoidingStatsQueryKey, getListFluidIntakeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Info, Moon, Droplet, Waves } from "lucide-react";
import { formatClinicalDateTime } from "@/lib/utils";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

const COLOR_HEX: Record<string, string> = {
  pale_yellow: "#FEFCE8", yellow: "#FEF08A", dark_yellow: "#FCD34D",
  orange: "#FB923C", dark_orange: "#C2410C",
};

const HEMATURIA_BADGE: Record<string, { label: string; cls: string }> = {
  visible_hematuria: { label: "Visible Blood", cls: "bg-red-100 text-red-700 border-red-200" },
  post_drops:        { label: "Post Drops",     cls: "bg-orange-100 text-orange-700 border-orange-200" },
  post_pink:         { label: "Post Pink",      cls: "bg-pink-100 text-pink-700 border-pink-200" },
};

const URGENCY_BADGE: Record<string, { label: string; cls: string }> = {
  awareness:    { label: "Awareness",    cls: "bg-blue-50 text-blue-700 border-blue-200" },
  urgent:       { label: "Urgent",       cls: "bg-amber-50 text-amber-700 border-amber-200" },
  highly_urgent:{ label: "Highly Urgent",cls: "bg-orange-50 text-orange-700 border-orange-200" },
  sudden_onset: { label: "Sudden Onset", cls: "bg-red-50 text-red-700 border-red-200" },
};

export default function History() {
  const [tab, setTab] = useState<"void" | "intake">("void");
  const { data: voidings, isLoading: vLoading } = useListVoidings();
  const { data: intakes, isLoading: iLoading } = useListFluidIntake();
  const deleteVoiding = useDeleteVoiding();
  const deleteIntake = useDeleteFluidIntake();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDeleteVoid = async (id: number) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await deleteVoiding.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListVoidingsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetVoidingStatsQueryKey() });
      toast({ title: "Entry deleted" });
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const handleDeleteIntake = async (id: number) => {
    if (!window.confirm("Delete this intake entry?")) return;
    try {
      await deleteIntake.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListFluidIntakeQueryKey() });
      toast({ title: "Entry deleted" });
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const isLoading = tab === "void" ? vLoading : iLoading;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-900">History</h2>
            <p className="text-slate-500 mt-1">All recorded entries.</p>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {tab === "void" ? voidings?.length ?? 0 : intakes?.length ?? 0} Entries
          </Badge>
        </div>

        {/* Tab bar */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button onClick={() => setTab("void")}
            className={cn("flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all",
              tab === "void" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            <Droplet className="w-4 h-4 inline mr-1.5 -mt-0.5" />Voidings
          </button>
          <button onClick={() => setTab("intake")}
            className={cn("flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all",
              tab === "intake" ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            <Waves className="w-4 h-4 inline mr-1.5 -mt-0.5" />Fluid Intake
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : tab === "void" ? (
          voidings?.length === 0 ? (
            <EmptyState label="No voiding events recorded yet." />
          ) : (
            <div className="space-y-3">
              {voidings?.map((item, idx) => {
                const hematuriaBadge = item.hematuria !== "none" ? HEMATURIA_BADGE[item.hematuria] : null;
                const urgencyBadge = item.urgency && item.urgency !== "none" ? URGENCY_BADGE[item.urgency] : null;
                const painLocs: string[] = item.painLocations ?? [];
                const appTags: string[] = item.appearanceTags ?? [];

                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: idx * 0.04 }}>
                    <Card className={hematuriaBadge ? "border-red-200 bg-red-50/20" : ""}>
                      <CardContent className="p-4 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Color swatch + volume */}
                          <div className="shrink-0 flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: COLOR_HEX[item.urineColor] ?? "#FEF08A" }} />
                            <span className="text-xs font-bold text-slate-700">{item.volumeMl}<span className="font-normal text-slate-400"> ml</span></span>
                          </div>

                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-slate-900 text-sm">{formatClinicalDateTime(item.voidedAt)}</h4>
                              {item.isNocturia && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                  <Moon className="w-3 h-3" /> Bedtime
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="outline" className="text-[10px] bg-white capitalize">{item.urineColor.replace(/_/g, " ")}</Badge>
                              {item.cloudy && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Cloudy</Badge>}
                              {appTags.map(t => <Badge key={t} variant="outline" className="text-[10px] bg-white capitalize">{t}</Badge>)}
                              {hematuriaBadge && <Badge variant="outline" className={cn("text-[10px] font-bold", hematuriaBadge.cls)}>{hematuriaBadge.label}</Badge>}
                              {urgencyBadge && <Badge variant="outline" className={cn("text-[10px]", urgencyBadge.cls)}>{urgencyBadge.label}</Badge>}
                              {painLocs.map(p => <Badge key={p} variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 capitalize">{p}</Badge>)}
                              {item.durationSeconds && <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">⏱ {item.durationSeconds}s</span>}
                              {item.qmax != null && <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Q {item.qmax} ml/s</span>}
                            </div>

                            {item.notes && <p className="text-xs text-slate-400 italic border-l-2 border-slate-200 pl-2 truncate">"{item.notes}"</p>}
                          </div>
                        </div>

                        <Button variant="ghost" size="icon" className="shrink-0 text-red-300 hover:text-red-600 hover:bg-red-50 w-8 h-8"
                          onClick={() => handleDeleteVoid(item.id)} disabled={deleteVoiding.isPending}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          intakes?.length === 0 ? (
            <EmptyState label="No fluid intake entries yet." />
          ) : (
            <div className="space-y-3">
              {intakes?.map((item, idx) => {
                const types: string[] = item.drinkTypes ?? [];
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: idx * 0.04 }}>
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex flex-col items-center justify-center text-teal-700 shrink-0">
                            <span className="text-xs font-bold leading-none">{item.volumeMl}</span>
                            <span className="text-[9px] font-medium">ml</span>
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-semibold text-slate-900 text-sm">{formatClinicalDateTime(item.recordedAt)}</h4>
                            <div className="flex flex-wrap gap-1">
                              {types.map(t => <Badge key={t} variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200 capitalize">{t}</Badge>)}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 text-red-300 hover:text-red-600 hover:bg-red-50 w-8 h-8"
                          onClick={() => handleDeleteIntake(item.id)} disabled={deleteIntake.isPending}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )
        )}
      </div>
    </Layout>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center p-16 border-2 border-dashed border-border rounded-2xl bg-slate-50">
      <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <p className="text-slate-500">{label}</p>
    </div>
  );
}
