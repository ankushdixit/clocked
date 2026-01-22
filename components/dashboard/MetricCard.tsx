"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
}

export function MetricCard({ title, value, subtitle, highlight }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        <p
          className={cn(
            "text-2xl font-bold mt-1",
            highlight && "text-emerald-500 dark:text-emerald-400"
          )}
        >
          {value}
        </p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
