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
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Input</span>
              <span className="text-sm font-medium">{formatCurrency(inputCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Output</span>
              <span className="text-sm font-medium">{formatCurrency(outputCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Cache Write</span>
              <span className="text-sm font-medium">{formatCurrency(cacheWriteCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Cache Read</span>
              <span className="text-sm font-medium">{formatCurrency(cacheReadCost)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-sm font-bold">{formatCurrency(total)}</span>
            </div>
            {cacheSavings !== null && cacheSavings > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span className="text-sm">Cache Savings</span>
                <span className="text-sm font-medium">{formatCurrency(cacheSavings)}</span>
              </div>
            )}
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
