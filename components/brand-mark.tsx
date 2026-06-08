import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-11 shrink-0 items-center overflow-hidden rounded-lg border border-coin/35 bg-gradient-to-br from-[#092719] via-[#123c25] to-[#071b13] px-4 text-[1.08rem] font-black text-coinSoft shadow-[0_18px_38px_rgba(19,47,29,0.20)] ring-1 ring-white/18",
        className
      )}
    >
      <span className="absolute inset-x-3 top-1 h-px bg-gradient-to-l from-transparent via-white/55 to-transparent" />
      <span className="absolute -left-6 -top-7 h-14 w-16 rotate-[-18deg] bg-white/10 blur-xl" />
      <span className="relative">الجرجيرة</span>
      <span className="absolute inset-x-4 bottom-2 h-px bg-gradient-to-l from-transparent via-coin/75 to-transparent" />
    </span>
  );
}
