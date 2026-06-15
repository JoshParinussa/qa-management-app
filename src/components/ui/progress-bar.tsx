import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  className?: string;
};

export function ProgressBar({ value, className }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  
  const getColorClass = () => {
    if (clampedValue >= 80) return "bg-green-500";
    if (clampedValue >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-gray-200", className)}>
      <div
        className={cn("h-full transition-all duration-300", getColorClass())}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
