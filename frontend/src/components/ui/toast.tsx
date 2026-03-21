"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

function Toaster() {
  return (
    <SonnerToaster
      closeButton
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "surface-panel rounded-3xl border border-border/70 shadow-[0_24px_70px_-46px_rgba(25,32,56,0.35)]",
          title: "text-sm font-semibold text-foreground",
          description: "text-sm text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-secondary text-secondary-foreground",
        },
      }}
    />
  );
}

export { Toaster, toast };
