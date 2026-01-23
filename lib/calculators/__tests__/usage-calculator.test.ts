import {
  calculateUsagePercentage,
  calculateValueMultiplier,
  calculateTimeRatio,
  formatCost,
  formatMultiplier,
} from "../usage-calculator";

describe("calculateUsagePercentage", () => {
  it("returns 0% for $0 cost", () => {
    expect(calculateUsagePercentage(0)).toBe(0);
  });

  it("returns 25% for $100 cost", () => {
    // $100 / $400 max = 25%
    expect(calculateUsagePercentage(100)).toBe(25);
  });

  it("returns 50% for $200 cost", () => {
    expect(calculateUsagePercentage(200)).toBe(50);
  });

  it("returns 100% for $400 cost", () => {
    expect(calculateUsagePercentage(400)).toBe(100);
  });

  it("caps at 100% for costs over $400", () => {
    expect(calculateUsagePercentage(500)).toBe(100);
    expect(calculateUsagePercentage(1000)).toBe(100);
  });

  it("returns 0% for negative cost", () => {
    expect(calculateUsagePercentage(-50)).toBe(0);
  });

  it("handles decimal costs", () => {
    // $200.80 / $400 = 50.2%
    expect(calculateUsagePercentage(200.8)).toBeCloseTo(50.2);
  });
});

describe("calculateValueMultiplier", () => {
  it("returns 0 for $0 cost", () => {
    expect(calculateValueMultiplier(0, 100)).toBe(0);
  });

  it("returns 1 when cost equals subscription", () => {
    expect(calculateValueMultiplier(100, 100)).toBe(1);
  });

  it("returns correct multiplier for high usage", () => {
    // $847.23 / $100 = 8.4723
    expect(calculateValueMultiplier(847.23, 100)).toBeCloseTo(8.4723);
  });

  it("handles $200 subscription", () => {
    // $847.23 / $200 = 4.23615
    expect(calculateValueMultiplier(847.23, 200)).toBeCloseTo(4.23615);
  });

  it("returns 0 when subscription is 0", () => {
    expect(calculateValueMultiplier(100, 0)).toBe(0);
  });

  it("returns 0 when subscription is negative", () => {
    expect(calculateValueMultiplier(100, -100)).toBe(0);
  });

  it("uses default $100 subscription when not specified", () => {
    expect(calculateValueMultiplier(200)).toBe(2);
  });
});

describe("calculateTimeRatio", () => {
  it("returns 0% for both when no time", () => {
    const result = calculateTimeRatio(0, 0);
    expect(result.humanPercentage).toBe(0);
    expect(result.claudePercentage).toBe(0);
  });

  it("returns correct percentages for equal time", () => {
    const result = calculateTimeRatio(5000, 5000);
    expect(result.humanPercentage).toBe(50);
    expect(result.claudePercentage).toBe(50);
  });

  it("returns correct percentages for 64:36 split", () => {
    // 64ms human, 36ms claude
    const result = calculateTimeRatio(64, 36);
    expect(result.humanPercentage).toBe(64);
    expect(result.claudePercentage).toBe(36);
  });

  it("rounds to whole numbers", () => {
    // 2/3 = 66.67% human, 33.33% claude
    const result = calculateTimeRatio(2, 1);
    expect(result.humanPercentage).toBe(67);
    expect(result.claudePercentage).toBe(33);
  });

  it("ensures percentages sum to 100", () => {
    const result = calculateTimeRatio(7, 3);
    expect(result.humanPercentage + result.claudePercentage).toBe(100);
  });

  it("handles 100% human time", () => {
    const result = calculateTimeRatio(1000, 0);
    expect(result.humanPercentage).toBe(100);
    expect(result.claudePercentage).toBe(0);
  });

  it("handles 100% claude time", () => {
    const result = calculateTimeRatio(0, 1000);
    expect(result.humanPercentage).toBe(0);
    expect(result.claudePercentage).toBe(100);
  });
});

describe("formatCost", () => {
  it("formats $0 correctly", () => {
    expect(formatCost(0)).toBe("$0.00");
  });

  it("formats whole dollars correctly", () => {
    expect(formatCost(100)).toBe("$100.00");
  });

  it("formats cents correctly", () => {
    expect(formatCost(847.23)).toBe("$847.23");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCost(847.235)).toBe("$847.24");
  });

  it("handles large numbers with comma separators", () => {
    expect(formatCost(1234.56)).toBe("$1,234.56");
  });
});

describe("formatMultiplier", () => {
  it("formats 0 correctly", () => {
    expect(formatMultiplier(0)).toBe("0.00x");
  });

  it("formats 1x correctly", () => {
    expect(formatMultiplier(1)).toBe("1.00x");
  });

  it("formats high multipliers correctly", () => {
    expect(formatMultiplier(8.4723)).toBe("8.47x");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatMultiplier(8.476)).toBe("8.48x");
  });

  it("handles fractional multipliers", () => {
    expect(formatMultiplier(0.5)).toBe("0.50x");
  });
});
