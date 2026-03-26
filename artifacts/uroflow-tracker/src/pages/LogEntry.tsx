import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useCreateVoiding, getListVoidingsQueryKey, getGetVoidingStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea, Select, Switch } from "@/components/ui/form-elements";
import { Button } from "@/components/ui/button";
import { UrineColorPicker } from "@/components/UrineColorPicker";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Droplet, AlertCircle, ArrowLeft, Loader2, X } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  voidedAt: z.string().min(1, "Date and time required"),
  volumeMl: z.coerce.number().min(1, "Volume is required and must be > 0"),
  qmax: z.coerce.number().min(0).optional().nullable(),
  durationSeconds: z.coerce.number().int().min(0).optional().nullable(),
  urineColor: z.enum(["clear", "pale_yellow", "yellow", "dark_yellow", "orange"]),
  cloudy: z.boolean(),
  bloodPresent: z.boolean(),
  urgency: z.enum(["none", "mild", "moderate", "severe"]).optional(),
  painLevel: z.coerce.number().min(0).max(10).optional().or(z.literal(0)),
  stream: z.enum(["strong", "normal", "weak", "intermittent", "dribbling"]).optional(),
  notes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function LogEntry() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateVoiding();

  const [volumeHundreds, setVolumeHundreds] = useState<number | null>(null);
  const [volumeExtras, setVolumeExtras] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      voidedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      volumeMl: 0,
      qmax: undefined,
      durationSeconds: undefined,
      urineColor: "yellow",
      cloudy: false,
      bloodPresent: false,
      urgency: "none",
      painLevel: 0,
      stream: "normal",
      notes: "",
    },
  });

  const bloodPresent = watch("bloodPresent");
  const cloudy = watch("cloudy");

  const HUNDREDS = [100, 200, 300, 400];
  const EXTRAS = [25, 50, 75];

  const handleHundredsSelect = (val: number) => {
    const next = volumeHundreds === val ? null : val;
    setVolumeHundreds(next);
    setValue("volumeMl", (next ?? 0) + (volumeExtras ?? 0), { shouldValidate: true });
  };

  const handleExtrasSelect = (val: number) => {
    const next = volumeExtras === val ? null : val;
    setVolumeExtras(next);
    setValue("volumeMl", (volumeHundreds ?? 0) + (next ?? 0), { shouldValidate: true });
  };

  const clearVolume = () => {
    setVolumeHundreds(null);
    setVolumeExtras(null);
    setValue("volumeMl", 0, { shouldValidate: true });
  };

  const totalVolume = (volumeHundreds ?? 0) + (volumeExtras ?? 0);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        ...data,
        voidedAt: new Date(data.voidedAt).toISOString(),
        qmax: data.qmax ?? null,
        durationSeconds: data.durationSeconds ?? null,
        painLevel: data.painLevel ?? null,
      };

      // @ts-ignore
      await createMutation.mutateAsync({ data: payload });

      queryClient.invalidateQueries({ queryKey: getListVoidingsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetVoidingStatsQueryKey() });

      toast({ title: "Entry logged successfully!" });
      setLocation("/history");
    } catch (error) {
      toast({ title: "Failed to log entry", variant: "destructive" });
      console.error(error);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-900">New Entry</h2>
            <p className="text-slate-500 mt-1">Record your latest voiding details accurately.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Section 1: Core Metrics */}
          <Card>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <Droplet className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-display">Core Metrics</h3>
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <Label>Date & Time <span className="text-red-500">*</span></Label>
                <Input
                  type="datetime-local"
                  {...register("voidedAt")}
                  className={errors.voidedAt ? "border-red-500" : ""}
                />
                {errors.voidedAt && <p className="text-xs text-red-500">{errors.voidedAt.message}</p>}
              </div>

              {/* Volume Button Picker */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Volume (ml) <span className="text-red-500">*</span></Label>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold tabular-nums ${totalVolume > 0 ? "text-primary" : "text-slate-300"}`}>
                      {totalVolume > 0 ? `${totalVolume} ml` : "— ml"}
                    </span>
                    {totalVolume > 0 && (
                      <button
                        type="button"
                        onClick={clearVolume}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                        aria-label="Clear volume"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <input type="hidden" {...register("volumeMl", { valueAsNumber: true })} />

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Step 1 — Hundreds</p>
                    <div className="grid grid-cols-4 gap-2">
                      {HUNDREDS.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleHundredsSelect(val)}
                          className={`
                            py-3 rounded-xl font-bold text-base border-2 transition-all duration-150 select-none
                            ${volumeHundreds === val
                              ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[0.97]"
                              : "bg-white text-slate-700 border-slate-200 hover:border-primary/50 hover:bg-primary/5"
                            }
                          `}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Step 2 — Fine Tune (optional)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {EXTRAS.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleExtrasSelect(val)}
                          className={`
                            py-3 rounded-xl font-bold text-base border-2 transition-all duration-150 select-none
                            ${volumeExtras === val
                              ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[0.97]"
                              : "bg-white text-slate-700 border-slate-200 hover:border-primary/50 hover:bg-primary/5"
                            }
                          `}
                        >
                          +{val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {errors.volumeMl && <p className="text-xs text-red-500">Please select a volume amount.</p>}
              </div>

              {/* Qmax & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label>Qmax (ml/s) — Optional</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 12.5"
                      {...register("qmax")}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">ml/s</span>
                  </div>
                  <p className="text-xs text-slate-400">Maximum flow rate</p>
                </div>

                <div className="space-y-2">
                  <Label>Duration (seconds) — Optional</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 45"
                      {...register("durationSeconds")}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">sec</span>
                  </div>
                  <p className="text-xs text-slate-400">Total time to void</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Visual Assessment */}
          <Card>
            <CardContent className="p-6 md:p-8 space-y-8">
              <div className="flex items-center gap-2 border-b border-border pb-4 mb-2">
                <h3 className="text-lg font-bold font-display">Visual Assessment</h3>
              </div>

              {/* Urine Color */}
              <div className="space-y-4">
                <Label className="text-base">Urine Color</Label>
                <Controller
                  control={control}
                  name="urineColor"
                  render={({ field }) => (
                    <UrineColorPicker
                      value={field.value}
                      onChange={field.onChange}
                      error={!!errors.urineColor}
                    />
                  )}
                />
              </div>

              {/* Cloudy toggle + Blood toggle side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Cloudy / Clear toggle */}
                <Controller
                  control={control}
                  name="cloudy"
                  render={({ field }) => (
                    <div className="p-4 rounded-2xl border-2 transition-all duration-300 bg-slate-50 border-transparent">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base text-slate-700">Appearance</Label>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                            !field.value
                              ? "bg-primary text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange(true)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                            field.value
                              ? "bg-amber-500 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Cloudy
                        </button>
                      </div>
                    </div>
                  )}
                />

                {/* Blood Present toggle */}
                <div className={`p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-center ${bloodPresent ? "bg-red-50 border-red-200" : "bg-slate-50 border-transparent"}`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className={`text-base ${bloodPresent ? "text-red-700" : "text-slate-700"}`}>Blood Present?</Label>
                      <p className="text-xs text-slate-500">Visible hematuria</p>
                    </div>
                    <Controller
                      control={control}
                      name="bloodPresent"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className={bloodPresent ? "!bg-red-500 peer-focus:!ring-red-200" : ""}
                        />
                      )}
                    />
                  </div>
                  {bloodPresent && (
                    <div className="mt-3 text-sm text-red-600 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="w-4 h-4" /> Please consult your doctor if persistent.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Experience Details */}
          <Card>
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 border-b border-border pb-4 mb-2">
                <h3 className="text-lg font-bold font-display">Experience Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label>Urgency Level</Label>
                  <Select {...register("urgency")}>
                    <option value="none">None</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe / Uncontrollable</option>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Stream Quality</Label>
                  <Select {...register("stream")}>
                    <option value="normal">Normal</option>
                    <option value="strong">Strong</option>
                    <option value="weak">Weak / Slow</option>
                    <option value="intermittent">Intermittent (Stops & Starts)</option>
                    <option value="dribbling">Dribbling</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                  <Label>Pain Level (0-10)</Label>
                  <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                    {watch("painLevel")} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  {...register("painLevel")}
                  className="w-full accent-primary h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 font-medium px-1">
                  <span>No Pain (0)</span>
                  <span>Severe Pain (10)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Notes */}
          <Card>
            <CardContent className="p-6 md:p-8 space-y-4">
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Any other symptoms, dietary notes, or observations..."
                {...register("notes")}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="sticky bottom-4 z-50 md:static">
            <Button
              type="submit"
              size="lg"
              className="w-full text-lg shadow-xl shadow-primary/20 md:w-auto md:min-w-[250px]"
              disabled={isSubmitting || createMutation.isPending}
            >
              {isSubmitting || createMutation.isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving Entry...</>
              ) : (
                "Save Voiding Entry"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
