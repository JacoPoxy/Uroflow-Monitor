import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateVoiding, useCreateFluidIntake, getListVoidingsQueryKey, getGetVoidingStatsQueryKey, getListFluidIntakeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea, Select } from "@/components/ui/form-elements";
import { Button } from "@/components/ui/button";
import { UrineColorPicker } from "@/components/UrineColorPicker";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Droplet, ArrowLeft, Loader2, X, Moon, Sun, Waves, Coffee, Zap, Beaker, Wine, GlassWater, Timer, Square, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// ---- Schemas ----
const voidingSchema = z.object({
  voidedAt: z.string().min(1),
  volumeMl: z.coerce.number().min(1, "Select a volume"),
  qmax: z.coerce.number().min(0).optional().nullable(),
  durationSeconds: z.coerce.number().int().min(0).optional().nullable(),
  urineColor: z.enum(["pale_yellow", "yellow", "dark_yellow", "orange", "dark_orange"]),
  cloudy: z.boolean(),
  hematuria: z.enum(["none", "visible_hematuria", "post_drops", "post_pink"]),
  urgency: z.enum(["none", "awareness", "urgent", "highly_urgent", "sudden_onset"]).optional(),
  stream: z.enum(["strong", "normal", "weak", "intermittent", "dribbling"]).optional(),
  isNocturia: z.boolean(),
  notes: z.string().max(500).optional(),
});

const intakeSchema = z.object({
  recordedAt: z.string().min(1),
  volumeMl: z.coerce.number().min(1, "Select a volume"),
});

type VoidingForm = z.infer<typeof voidingSchema>;
type IntakeForm = z.infer<typeof intakeSchema>;

// ---- Helpers ----
const HUNDREDS = [100, 200, 300, 400];
const EXTRAS = [25, 50, 75];

function VolumeButtons({
  hundreds, extras, onHundreds, onExtras, total, onClear, error,
}: {
  hundreds: number | null; extras: number | null;
  onHundreds: (v: number) => void; onExtras: (v: number) => void;
  total: number; onClear: () => void; error?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Volume (ml) <span className="text-red-500">*</span></Label>
        <div className="flex items-center gap-2">
          <span className={cn("text-2xl font-bold tabular-nums", total > 0 ? "text-primary" : "text-slate-300")}>
            {total > 0 ? `${total} ml` : "— ml"}
          </span>
          {total > 0 && (
            <button type="button" onClick={onClear} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Step 1 — Hundreds</p>
        <div className="grid grid-cols-4 gap-2">
          {HUNDREDS.map(val => (
            <button key={val} type="button" onClick={() => onHundreds(val)}
              className={cn("py-3 rounded-xl font-bold text-base border-2 transition-all duration-150 select-none",
                hundreds === val ? "bg-primary text-white border-primary shadow-md scale-[0.97]" : "bg-white text-slate-700 border-slate-200 hover:border-primary/50 hover:bg-primary/5")}>
              {val}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Step 2 — Fine Tune (optional)</p>
        <div className="grid grid-cols-3 gap-2">
          {EXTRAS.map(val => (
            <button key={val} type="button" onClick={() => onExtras(val)}
              className={cn("py-3 rounded-xl font-bold text-base border-2 transition-all duration-150 select-none",
                extras === val ? "bg-primary text-white border-primary shadow-md scale-[0.97]" : "bg-white text-slate-700 border-slate-200 hover:border-primary/50 hover:bg-primary/5")}>
              +{val}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-xs text-red-500">Please select a volume amount.</p>}
    </div>
  );
}

function MultiChip<T extends string>({
  options, selected, onChange, colorFn,
}: {
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (v: T[]) => void;
  colorFn?: (v: T, active: boolean) => string;
}) {
  const toggle = (v: T) => {
    if (selected.includes(v)) onChange(selected.filter(x => x !== v));
    else onChange([...selected, v]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const active = selected.includes(o.value);
        const cls = colorFn ? colorFn(o.value, active) : (active ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40");
        return (
          <button key={o.value} type="button" onClick={() => toggle(o.value)}
            className={cn("px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-150 select-none", cls)}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SingleChip<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn("px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-150 select-none",
            value === o.value ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---- Duration Stopwatch ----
function DurationStopwatch({
  value, onChange,
}: { value: number | null; onChange: (v: number | null) => void }) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    setElapsed(0);
    onChange(null);
    setCountdown(3);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    onChange(elapsed);
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setCountdown(null);
    setElapsed(0);
    onChange(null);
  };

  // Countdown tick
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setRunning(true);
      return;
    }
    const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Stopwatch tick
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const hasFinalValue = !running && countdown === null && value != null && value > 0;
  const isCountingDown = countdown !== null;

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    onChange(isNaN(v) || v < 0 ? null : v);
  };

  return (
    <div className="space-y-1">
      <Label>Duration — Optional</Label>

      {/* Countdown overlay */}
      {isCountingDown && (
        <div className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-amber-300 bg-amber-50">
          <span className="text-6xl font-black tabular-nums text-amber-500 animate-bounce leading-none" key={countdown}>
            {countdown}
          </span>
          <p className="text-sm font-semibold text-amber-600">Get ready…</p>
          <button type="button" onClick={reset}
            className="mt-1 text-xs text-amber-400 hover:text-amber-600 underline">
            Cancel
          </button>
        </div>
      )}

      {/* Main input row (hidden during countdown) */}
      {!isCountingDown && (
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-xl border-2 transition-all",
          running ? "border-primary bg-primary/5" : hasFinalValue ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"
        )}>
          <Timer className={cn("w-4 h-4 shrink-0", running ? "text-primary animate-pulse" : "text-slate-400")} />

          {running ? (
            <span className="flex-1 text-2xl font-bold tabular-nums tracking-tight text-primary">
              {elapsed}
            </span>
          ) : (
            <input
              type="number"
              min="0"
              step="1"
              placeholder="—"
              value={value ?? ""}
              onChange={handleManualInput}
              className="flex-1 text-2xl font-bold tabular-nums bg-transparent outline-none w-0 min-w-0 text-slate-700 placeholder:text-slate-300"
            />
          )}

          <span className={cn("text-sm font-medium shrink-0", running ? "text-primary/70" : "text-slate-400")}>sec</span>

          <div className="flex items-center gap-1.5 shrink-0">
            {!running && (
              <button type="button" onClick={start}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/25">
                <Timer className="w-3.5 h-3.5" /> {hasFinalValue ? "Retimer" : "Start"}
              </button>
            )}
            {running && (
              <button type="button" onClick={stop}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 active:scale-95 transition-all shadow-sm shadow-red-200 animate-pulse">
                <Square className="w-3.5 h-3.5 fill-white" /> Stop
              </button>
            )}
            {(hasFinalValue || running) && (
              <button type="button" onClick={reset}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                title="Reset">
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Voiding Tab ----
function VoidingTab() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateVoiding();

  const [vH, setVH] = useState<number | null>(null);
  const [vE, setVE] = useState<number | null>(null);
  const [paintLocations, setPainLocations] = useState<string[]>([]);
  const [appearanceTags, setAppearanceTags] = useState<string[]>([]);
  const [durationSecs, setDurationSecs] = useState<number | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<VoidingForm>({
    resolver: zodResolver(voidingSchema),
    defaultValues: {
      voidedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      volumeMl: 0,
      urineColor: "yellow",
      cloudy: false,
      hematuria: "none",
      urgency: "none",
      stream: "normal",
      isNocturia: false,
      notes: "",
    },
  });

  const cloudy = watch("cloudy");
  const hematuria = watch("hematuria");
  const urgency = watch("urgency") ?? "none";
  const isNocturia = watch("isNocturia");
  const totalVolume = (vH ?? 0) + (vE ?? 0);

  const handleHundreds = (val: number) => {
    const next = vH === val ? null : val;
    setVH(next);
    setValue("volumeMl", (next ?? 0) + (vE ?? 0), { shouldValidate: true });
  };
  const handleExtras = (val: number) => {
    const next = vE === val ? null : val;
    setVE(next);
    setValue("volumeMl", (vH ?? 0) + (next ?? 0), { shouldValidate: true });
  };
  const clearVol = () => { setVH(null); setVE(null); setValue("volumeMl", 0, { shouldValidate: true }); };

  const onSubmit = async (data: VoidingForm) => {
    try {
      const payload = {
        ...data,
        voidedAt: new Date(data.voidedAt).toISOString(),
        qmax: data.qmax ?? null,
        durationSeconds: durationSecs ?? null,
        painLocations: paintLocations.length > 0 ? paintLocations : null,
        appearanceTags: appearanceTags.length > 0 ? appearanceTags : null,
      };
      // @ts-ignore
      await createMutation.mutateAsync({ data: payload });
      queryClient.invalidateQueries({ queryKey: getListVoidingsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetVoidingStatsQueryKey() });
      toast({ title: "Void entry logged!" });
      setLocation("/history");
    } catch {
      toast({ title: "Failed to log entry", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Core Metrics */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary"><Droplet className="w-4 h-4" /></div>
            <h3 className="font-bold text-base">Core Metrics</h3>
          </div>

          <div className="space-y-2">
            <Label>Date & Time <span className="text-red-500">*</span></Label>
            <Input type="datetime-local" {...register("voidedAt")} />
          </div>

          <input type="hidden" {...register("volumeMl", { valueAsNumber: true })} />
          <VolumeButtons hundreds={vH} extras={vE} onHundreds={handleHundreds} onExtras={handleExtras}
            total={totalVolume} onClear={clearVol} error={!!errors.volumeMl} />

          <div className="space-y-1">
            <Label>Qmax (ml/s) — Optional</Label>
            <div className="relative">
              <Input type="number" min="0" step="0.1" placeholder="e.g. 12.5" {...register("qmax")} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">ml/s</span>
            </div>
          </div>

          <DurationStopwatch value={durationSecs} onChange={setDurationSecs} />

          {/* Bedtime / Awake toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <Sun className={cn("w-5 h-5 transition-colors", isNocturia ? "text-slate-300" : "text-amber-400")} />
            <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-200 flex-1">
              <button type="button" onClick={() => setValue("isNocturia", false)}
                className={cn("flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all", !isNocturia ? "bg-amber-400 text-white shadow-sm" : "text-slate-500")}>
                Awake
              </button>
              <button type="button" onClick={() => setValue("isNocturia", true)}
                className={cn("flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all", isNocturia ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500")}>
                Bedtime
              </button>
            </div>
            <Moon className={cn("w-5 h-5 transition-colors", isNocturia ? "text-indigo-500" : "text-slate-300")} />
          </div>
        </CardContent>
      </Card>

      {/* Visual Assessment */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <h3 className="font-bold text-base border-b border-border pb-3">Visual Assessment</h3>

          <div className="space-y-3">
            <Label>Urine Color</Label>
            <UrineColorPicker value={watch("urineColor")} onChange={v => setValue("urineColor", v as any)} error={!!errors.urineColor} />
          </div>

          {/* Appearance row */}
          <div className="space-y-3">
            <Label>Appearance</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Cloudy toggle */}
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-200">
                <button type="button" onClick={() => setValue("cloudy", false)}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all", !cloudy ? "bg-primary text-white shadow-sm" : "text-slate-500")}>
                  Clear
                </button>
                <button type="button" onClick={() => setValue("cloudy", true)}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all", cloudy ? "bg-amber-500 text-white shadow-sm" : "text-slate-500")}>
                  Cloudy
                </button>
              </div>
              {/* Specks etc */}
              <MultiChip
                options={[
                  { value: "clots", label: "Clots" },
                  { value: "flakes", label: "Flakes" },
                  { value: "specks", label: "Specks" },
                ]}
                selected={appearanceTags as any}
                onChange={setAppearanceTags}
                colorFn={(_, active) => active ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-white text-slate-600 border-slate-200 hover:border-amber-200"}
              />
            </div>
          </div>

          {/* Hematuria */}
          <div className="space-y-3">
            <Label>Blood / Hematuria</Label>
            <SingleChip
              options={[
                { value: "none", label: "None" },
                { value: "post_pink", label: "Post Pink" },
                { value: "post_drops", label: "Post Drops" },
                { value: "visible_hematuria", label: "Visible Blood" },
              ]}
              value={hematuria}
              onChange={v => setValue("hematuria", v as any)}
            />
            {hematuria !== "none" && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                ⚠ Please consult your doctor if this persists.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Symptoms */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <h3 className="font-bold text-base border-b border-border pb-3">Symptoms</h3>

          {/* Urgency */}
          <div className="space-y-3">
            <Label>Urgency</Label>
            <SingleChip
              options={[
                { value: "none", label: "None" },
                { value: "awareness", label: "Awareness" },
                { value: "urgent", label: "Urgent" },
                { value: "highly_urgent", label: "Highly Urgent" },
                { value: "sudden_onset", label: "Sudden Onset" },
              ]}
              value={urgency as any}
              onChange={v => setValue("urgency", v as any)}
            />
          </div>

          {/* Pain Locations */}
          <div className="space-y-3">
            <Label>Pain Location (select all that apply)</Label>
            <MultiChip
              options={[
                { value: "spasm", label: "Spasm" },
                { value: "perineum", label: "Perineum" },
                { value: "shaft", label: "Shaft" },
                { value: "tip", label: "Tip" },
              ]}
              selected={paintLocations as any}
              onChange={setPainLocations}
              colorFn={(_, active) => active ? "bg-orange-100 text-orange-800 border-orange-300" : "bg-white text-slate-600 border-slate-200 hover:border-orange-200"}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stream Quality</Label>
              <Select {...register("stream")}>
                <option value="normal">Normal</option>
                <option value="strong">Strong</option>
                <option value="weak">Weak / Slow</option>
                <option value="intermittent">Intermittent</option>
                <option value="dribbling">Dribbling</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <Label>Notes (optional)</Label>
          <Textarea placeholder="Any additional observations..." {...register("notes")} />
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-50 md:static">
        <Button type="submit" size="lg" className="w-full text-base shadow-xl shadow-primary/20" disabled={isSubmitting || createMutation.isPending}>
          {isSubmitting || createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Void Entry"}
        </Button>
      </div>
    </form>
  );
}

// ---- Fluid Intake Tab ----
const DRINK_OPTIONS = [
  { value: "neutral", label: "Neutral", icon: GlassWater },
  { value: "caffeine", label: "Caffeine", icon: Coffee },
  { value: "fizzy", label: "Fizzy", icon: Zap },
  { value: "acidic", label: "Acidic", icon: Beaker },
  { value: "alcohol", label: "Alcohol", icon: Wine },
];

function IntakeTab() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateFluidIntake();

  const [vH, setVH] = useState<number | null>(null);
  const [vE, setVE] = useState<number | null>(null);
  const [drinkTypes, setDrinkTypes] = useState<string[]>(["neutral"]);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<IntakeForm>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      recordedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      volumeMl: 0,
    },
  });

  const totalVolume = (vH ?? 0) + (vE ?? 0);

  const handleHundreds = (val: number) => {
    const next = vH === val ? null : val;
    setVH(next);
    setValue("volumeMl", (next ?? 0) + (vE ?? 0), { shouldValidate: true });
  };
  const handleExtras = (val: number) => {
    const next = vE === val ? null : val;
    setVE(next);
    setValue("volumeMl", (vH ?? 0) + (next ?? 0), { shouldValidate: true });
  };
  const clearVol = () => { setVH(null); setVE(null); setValue("volumeMl", 0, { shouldValidate: true }); };

  const toggleDrink = (v: string) => {
    if (v === "neutral") { setDrinkTypes(["neutral"]); return; }
    const without = drinkTypes.filter(x => x !== "neutral");
    if (without.includes(v)) setDrinkTypes(without.filter(x => x !== v) || ["neutral"]);
    else setDrinkTypes([...without, v]);
  };

  const onSubmit = async (data: IntakeForm) => {
    try {
      const payload = {
        ...data,
        recordedAt: new Date(data.recordedAt).toISOString(),
        drinkTypes: drinkTypes.length > 0 ? drinkTypes : null,
      };
      // @ts-ignore
      await createMutation.mutateAsync({ data: payload });
      queryClient.invalidateQueries({ queryKey: getListFluidIntakeQueryKey() });
      toast({ title: "Fluid intake logged!" });
      setLocation("/history");
    } catch {
      toast({ title: "Failed to log intake", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <div className="bg-teal-100 p-2 rounded-lg text-teal-600"><Waves className="w-4 h-4" /></div>
            <h3 className="font-bold text-base">Fluid Intake</h3>
          </div>

          <div className="space-y-2">
            <Label>Date & Time <span className="text-red-500">*</span></Label>
            <Input type="datetime-local" {...register("recordedAt")} />
          </div>

          <input type="hidden" {...register("volumeMl", { valueAsNumber: true })} />
          <VolumeButtons hundreds={vH} extras={vE} onHundreds={handleHundreds} onExtras={handleExtras}
            total={totalVolume} onClear={clearVol} error={!!errors.volumeMl} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold text-base border-b border-border pb-3">Drink Type</h3>
          <div className="grid grid-cols-5 gap-2">
            {DRINK_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = drinkTypes.includes(value);
              return (
                <button key={value} type="button" onClick={() => toggleDrink(value)}
                  className={cn("flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-150 select-none",
                    active ? "bg-teal-500 text-white border-teal-500 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-teal-300")}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-semibold">{label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400">Select all that apply. "Neutral" is the default.</p>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-50 md:static">
        <Button type="submit" size="lg" className="w-full text-base bg-teal-500 hover:bg-teal-600 shadow-xl shadow-teal-200" disabled={isSubmitting || createMutation.isPending}>
          {isSubmitting || createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Fluid Intake"}
        </Button>
      </div>
    </form>
  );
}

// ---- Main Page ----
export default function LogEntry() {
  const [tab, setTab] = useState<"void" | "intake">("void");

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-900">New Entry</h2>
            <p className="text-slate-500 mt-1">Log a voiding event or fluid intake.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button type="button" onClick={() => setTab("void")}
            className={cn("flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all",
              tab === "void" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            <Droplet className="w-4 h-4 inline mr-1.5 -mt-0.5" />Voiding
          </button>
          <button type="button" onClick={() => setTab("intake")}
            className={cn("flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all",
              tab === "intake" ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            <Waves className="w-4 h-4 inline mr-1.5 -mt-0.5" />Fluid Intake
          </button>
        </div>

        {tab === "void" ? <VoidingTab /> : <IntakeTab />}
      </div>
    </Layout>
  );
}
