"use client";

/**
 * Cost Analysis Card Component
 *
 * Displays cost breakdown by input/output/cache tokens.
 * Shows placeholder data until Story 2.3 is implemented.
 */

import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CostAnalysisCardProps {
  inputCost: number | null;
  outputCost: number | null;
  cacheWriteCost: number | null;
  cacheReadCost: number | null;
  cacheSavings: number | null;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function CostAnalysisCard({
  inputCost,
  outputCost,
  cacheWriteCost,
  cacheReadCost,
  cacheSavings,
}: CostAnalysisCardProps) {
  const hasData =
    inputCost !== null && outputCost !== null && cacheWriteCost !== null && cacheReadCost !== null;

  const total = hasData ? inputCost + outputCost + cacheWriteCost + cacheReadCost : 0;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Cost Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        {hasData ? (
          <div className="space-y-2">
            <CostRow label="Input" value={formatCurrency(inputCost)} />
            <CostRow label="Output" value={formatCurrency(outputCost)} />
            <CostRow label="Cache Write" value={formatCurrency(cacheWriteCost)} />
            <CostRow label="Cache Read" value={formatCurrency(cacheReadCost)} />
            <div className="border-t pt-2 mt-2">
              <CostRow label="Total" value={formatCurrency(total)} />
              {cacheSavings !== null && cacheSavings > 0 && (
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-emerald-600">Cache Savings</span>
                  <span className="font-medium tabular-nums text-emerald-600">
                    {formatCurrency(cacheSavings)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground text-sm">
            <p className="text-2xl font-medium mb-1">—</p>
            <p className="text-xs">Available in future update</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
