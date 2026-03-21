"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "@/types/user.types";

interface AuthGuardProps {
  children: ReactNode;
  roles?: UserRole[];
  fallback?: ReactNode;
}

export function AuthGuard({ children, roles, fallback }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const hasRequiredRole = !roles?.length || (user ? roles.includes(user.role) : false);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!hasRequiredRole) {
      router.replace("/");
    }
  }, [hasRequiredRole, hydrated, isAuthenticated, pathname, router]);

  if (!hydrated || !isAuthenticated || !hasRequiredRole) {
    return fallback ?? (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Đang kiểm tra phiên đăng nhập..." />
      </div>
    );
  }

  return children;
}

export function withAuthGuard<P extends object>(
  WrappedComponent: ComponentType<P>,
  options?: { roles?: UserRole[]; fallback?: ReactNode },
) {
  function GuardedComponent(props: P) {
    return (
      <AuthGuard roles={options?.roles} fallback={options?.fallback}>
        <WrappedComponent {...props} />
      </AuthGuard>
    );
  }

  GuardedComponent.displayName = `withAuthGuard(${WrappedComponent.displayName ?? WrappedComponent.name ?? "Component"})`;

  return GuardedComponent;
}
