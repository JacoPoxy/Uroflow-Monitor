import { useListVoidings, useDeleteVoiding, getListVoidingsQueryKey, getGetVoidingStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle, Info } from "lucide-react";
import { formatClinicalDateTime } from "@/lib/utils";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function History() {
  const { data: voidings, isLoading } = useListVoidings();
  const deleteMutation = useDeleteVoiding();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListVoidingsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetVoidingStatsQueryKey() });
      toast({ title: "Entry deleted successfully" });
    } catch (e) {
      toast({ title: "Failed to delete entry", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-900">Complete History</h2>
            <p className="text-slate-500 mt-1">All your recorded voiding events.</p>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {voidings?.length || 0} Entries
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : voidings?.length === 0 ? (
          <div className="text-center p-16 border-2 border-dashed border-border rounded-2xl bg-slate-50">
            <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">No History Yet</h3>
            <p className="text-slate-500 mt-1">Log your first voiding event to see it here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {voidings?.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={item.bloodPresent ? "border-red-200 bg-red-50/30" : ""}>
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Volume Bubble */}
                      <div className="w-14 h-14 shrink-0 rounded-full bg-blue-50 flex flex-col items-center justify-center border-2 border-blue-100 shadow-inner text-primary">
                        <span className="text-lg font-bold leading-none">{item.volumeMl}</span>
                        <span className="text-[10px] font-semibold opacity-80 uppercase">ml</span>
                      </div>
                      
                      {/* Details */}
                      <div className="space-y-1">
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                          {formatClinicalDateTime(item.voidedAt)}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="bg-white capitalize text-slate-600 shadow-sm">
                            Color: {item.urineColor.replace('_', ' ')}
                          </Badge>
                          
                          <Badge variant="outline" className="bg-white capitalize text-slate-600 shadow-sm">
                            {item.cloudiness.replace('_', ' ')}
                          </Badge>
                          
                          {item.durationSeconds && (
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                              ⏱ {item.durationSeconds}s
                            </span>
                          )}
                          
                          {item.urgency && item.urgency !== 'none' && (
                            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md capitalize">
                              ⚡ {item.urgency} urgency
                            </span>
                          )}
                          
                          {item.painLevel ? (
                            <span className="text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded-md">
                              😣 Pain: {item.painLevel}/10
                            </span>
                          ) : null}
                          
                          {item.bloodPresent && (
                            <Badge variant="destructive" className="animate-pulse shadow-sm shadow-red-200 uppercase font-bold text-[10px]">
                              <AlertCircle className="w-3 h-3 mr-1" /> Blood Detected
                            </Badge>
                          )}
                        </div>
                        
                        {item.notes && (
                          <p className="text-sm text-slate-500 mt-2 italic border-l-2 border-slate-200 pl-2">
                            "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center justify-end border-t sm:border-t-0 sm:border-l border-border/50 pt-3 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 ml-auto"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete entry"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
