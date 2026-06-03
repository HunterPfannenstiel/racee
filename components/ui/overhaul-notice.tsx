import { WrenchIcon } from "lucide-react";

interface OverhaulNoticeProps {
  message?: string;
}

export function OverhaulNotice({ message = "This page is being redesigned and will look different soon." }: OverhaulNoticeProps) {
  return (
    <div className="flex items-start gap-3 rounded-sm border border-warning/40 bg-warning/10 px-4 py-3">
      <WrenchIcon className="size-4 text-warning shrink-0 mt-0.5" />
      <p className="text-xs text-white leading-relaxed">{message}</p>
    </div>
  );
}
