export function Footer() {
  return (
    <footer className="px-4 pb-28 pt-4 md:px-6 md:pb-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 rounded-[1.75rem] border border-border/70 bg-card/60 px-5 py-4 text-sm text-muted-foreground shadow-sm md:flex-row md:items-center md:justify-between">
        <p>Inkline phase 8: hồ sơ công khai, admin console, dark mode và lớp SEO nền tảng.</p>
        <p className="uppercase tracking-[0.2em]">Next.js 16 • Tailwind 4 • Zustand • Query</p>
      </div>
    </footer>
  );
}
