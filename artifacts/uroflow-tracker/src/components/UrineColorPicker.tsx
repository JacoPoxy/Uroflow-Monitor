import * as React from "react";
import { cn } from "@/lib/utils";

interface UrineColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

const colorOptions: { key: string; hex: string; label: string; border: string }[] = [
  { key: "pale_yellow", hex: "#FEFCE8", label: "Pale Yellow", border: "#FDE68A" },
  { key: "yellow",      hex: "#FEF08A", label: "Yellow",      border: "#EAB308" },
  { key: "dark_yellow", hex: "#FCD34D", label: "Dark Yellow", border: "#D97706" },
  { key: "orange",      hex: "#FB923C", label: "Orange",      border: "#EA580C" },
  { key: "dark_orange", hex: "#C2410C", label: "Dark Orange", border: "#7C2D12" },
];

export function UrineColorPicker({ value, onChange, error }: UrineColorPickerProps) {
  return (
    <div className={cn("flex gap-3", error && "p-2 rounded-xl bg-destructive/5 border border-destructive/20")}>
      {colorOptions.map(({ key, hex, label, border }) => {
        const isSelected = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "flex flex-col items-center gap-2 flex-1 group transition-all duration-200 outline-none",
            )}
            title={label}
          >
            <div
              className={cn(
                "w-full aspect-square rounded-xl border-2 transition-all duration-200",
                isSelected ? "scale-105 shadow-md ring-2 ring-offset-2 ring-primary" : "hover:scale-103 hover:shadow-sm",
              )}
              style={{ backgroundColor: hex, borderColor: isSelected ? "var(--color-primary, #3B82F6)" : border }}
            />
            <span className={cn("text-[10px] font-medium text-center leading-tight transition-colors", isSelected ? "text-primary font-bold" : "text-slate-500")}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
