import { BrandMark } from "@/components/brand-mark";

export default function Loading() {
  return (
    <main className="page-loading mx-auto w-full max-w-5xl px-4 py-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <BrandMark />
        <span className="h-10 w-24 rounded-lg bg-white/80" />
      </div>
      <section className="rounded-lg border border-line bg-white/88 p-5 shadow-card">
        <div className="loading-block h-5 w-36 rounded-full" />
        <div className="mt-5 grid gap-3">
          <div className="loading-block h-24 rounded-lg" />
          <div className="loading-block h-16 rounded-lg" />
          <div className="loading-block h-16 rounded-lg" />
        </div>
      </section>
    </main>
  );
}
