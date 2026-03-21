export function Footer() {
  return (
    <footer className="px-4 pb-8 pt-4 md:px-6">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 rounded-[1.75rem] border border-border/70 bg-white/55 px-5 py-4 text-sm text-muted-foreground shadow-sm md:flex-row md:items-center md:justify-between">
        <p>Frontend foundation cho blog platform với luồng comment miễn phí và question trả phí.</p>
        <p className="uppercase tracking-[0.2em]">Next.js 16 • Tailwind 4 • Zustand • Query</p>
      </div>
    </footer>
  );
}
