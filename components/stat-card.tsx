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
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-muted">{title}</p>
          <p className="mt-1 text-2xl font-black text-leafDark">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-limeSoft text-leaf">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {note ? <p className="mt-3 text-xs leading-5 text-muted">{note}</p> : null}
    </div>
  );
}
