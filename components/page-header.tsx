import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[1.7rem] font-black leading-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-sage">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
    </div>
  );
}
