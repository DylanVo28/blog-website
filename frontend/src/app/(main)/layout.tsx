import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 pb-10 pt-2 md:px-6 md:pb-8">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <Footer />
      <BottomNavigation />
    </div>
  );
}
