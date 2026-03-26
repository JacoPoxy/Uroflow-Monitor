import * as React from "react";
import { cn } from "@/lib/utils";
import { VoidingEventUrineColor } from "@workspace/api-client-react";

interface UrineColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

const colorMap: Record<string, { hex: string; label: string }> = {
  pale_yellow: { hex: "#FFFFE0", label: "Pale" },
  yellow: { hex: "#FFF000", label: "Yellow" },
  dark_yellow: { hex: "#FFD700", label: "Dark" },
  amber: { hex: "#FFBF00", label: "Amber" },
  orange: { hex: "#FFA500", label: "Orange" },
  pink: { hex: "#FFC0CB", label: "Pink" },
  red: { hex: "#FF4444", label: "Red" },
  brown: { hex: "#8B4513", label: "Brown" },
  clear: { hex: "#FFFFFF", label: "Clear" },
  other: { hex: "#A0A0A0", label: "Other" },
};

export function UrineColorPicker({ value, onChange, error }: UrineColorPickerProps) {
  return (
    <div className={cn("grid grid-cols-5 gap-3", error && "p-2 rounded-xl bg-destructive/5 border border-destructive/20")}>
      {Object.entries(colorMap).map(([key, config]) => {
        const isSelected = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "flex flex-col items-center gap-2 group transition-all duration-200 outline-none",
            )}
            title={config.label}
          >
            <div 
              className={cn(
                "w-12 h-12 rounded-full border-2 shadow-sm transition-all duration-300 relative",
                isSelected ? "scale-110 border-primary shadow-primary/20 ring-4 ring-primary/10" : "border-black/5 hover:scale-105 hover:shadow-md",
                key === 'clear' && !isSelected && "border-slate-200"
              )}
              style={{ backgroundColor: config.hex }}
            >
              {isSelected && (
                <div className="absolute inset-0 rounded-full border-2 border-white/50 m-1 mix-blend-overlay"></div>
              )}
            </div>
            <span className={cn(
              "text-[10px] font-medium transition-colors",
              isSelected ? "text-primary font-bold" : "text-slate-500"
            )}>
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
