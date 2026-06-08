import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  icon: Icon,
  note
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  note?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-white/80 bg-white/88 p-4 shadow-card ring-1 ring-line/60">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-coin via-lime to-leaf" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-sage">{title}</p>
          <p className="mt-1 text-2xl font-black text-ink">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-lime/60 bg-limeSoft/80 text-leaf shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {note ? <p className="mt-3 text-xs leading-5 text-sage">{note}</p> : null}
    </div>
  );
}
