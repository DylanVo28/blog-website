"use client";

import { LaptopMinimal, MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiStore } from "@/stores/uiStore";
import type { ThemeMode } from "@/stores/uiStore";

const themeOptions: Array<{
  value: ThemeMode;
  label: string;
  icon: typeof SunMedium;
}> = [
  {
    value: "light",
    label: "Sáng",
    icon: SunMedium,
  },
  {
    value: "dark",
    label: "Tối",
    icon: MoonStar,
  },
  {
    value: "system",
    label: "Theo hệ thống",
    icon: LaptopMinimal,
  },
];

export function ThemeToggle() {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const activeTheme = themeOptions.find((option) => option.value === theme) ?? themeOptions[2];
  const ActiveIcon = activeTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <ActiveIcon className="size-4" />
          <span className="sr-only">Chuyển theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Chế độ giao diện</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as ThemeMode)}
        >
          {themeOptions.map((option) => {
            const Icon = option.icon;

            return (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <Icon className="size-4" />
                {option.label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
