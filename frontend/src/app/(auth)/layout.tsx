import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="paper-grid flex min-h-screen items-center justify-center px-4 py-10 md:px-6">
      <div className="w-full max-w-3xl rounded-[2rem] border border-border/70 bg-white/75 p-4 shadow-[0_28px_90px_-58px_rgba(25,32,56,0.4)] backdrop-blur md:p-6">
        {children}
      </div>
    </main>
  );
}
