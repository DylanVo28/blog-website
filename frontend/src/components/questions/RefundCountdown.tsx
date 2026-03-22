"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

interface RefundCountdownProps {
  deadline: string;
}

function formatTimeLeft(deadline: string) {
  const diffMs = new Date(deadline).getTime() - Date.now();

  if (diffMs <= 0) {
    return "Đã hết hạn, đang chờ hoàn tiền";
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

export function RefundCountdown({ deadline }: RefundCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => formatTimeLeft(deadline));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeft(formatTimeLeft(deadline));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [deadline]);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100/80 px-3 py-1.5 text-xs text-amber-900">
      <Clock3 className="size-3.5" />
      <span>
        Hoàn tiền tự động sau: <strong>{timeLeft}</strong>
      </span>
    </div>
  );
}
