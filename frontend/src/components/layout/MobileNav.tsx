"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { secondaryNavigation } from "@/lib/navigation";
import { primaryNavigation } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="md:hidden" size="icon" variant="outline">
          <Menu className="size-4" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="paper-grid">
        <SheetHeader>
          <SheetTitle>Inkline</SheetTitle>
          <SheetDescription>
            Điều hướng nhanh cho các route đã dựng ở phase 1.
          </SheetDescription>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-2">
          {[...primaryNavigation, ...secondaryNavigation].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
