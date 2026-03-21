import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="paper-grid min-h-screen px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </main>
  );
}
