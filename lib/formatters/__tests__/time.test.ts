import { formatDuration, formatLastActivity } from "../time";

describe("formatDuration", () => {
  it("formats zero milliseconds", () => {
    expect(formatDuration(0)).toBe("0m");
  });

  it("formats negative milliseconds as 0m", () => {
    expect(formatDuration(-1000)).toBe("0m");
  });

  it("formats minutes only", () => {
    expect(formatDuration(5 * 60 * 1000)).toBe("5m");
    expect(formatDuration(30 * 60 * 1000)).toBe("30m");
    expect(formatDuration(59 * 60 * 1000)).toBe("59m");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(60 * 60 * 1000)).toBe("1h 0m");
    expect(formatDuration(90 * 60 * 1000)).toBe("1h 30m");
    expect(formatDuration(2 * 60 * 60 * 1000 + 15 * 60 * 1000)).toBe("2h 15m");
  });

  it("formats large durations", () => {
    expect(formatDuration(24 * 60 * 60 * 1000)).toBe("24h 0m");
    expect(formatDuration(100 * 60 * 60 * 1000)).toBe("100h 0m");
  });

  it("handles fractional minutes by flooring", () => {
    expect(formatDuration(90 * 1000)).toBe("1m");
    expect(formatDuration(119 * 1000)).toBe("1m");
    expect(formatDuration(120 * 1000)).toBe("2m");
  });
});

describe("formatLastActivity", () => {
  // Use a fixed "now" date for consistent tests
  const MOCK_NOW = new Date("2025-06-15T12:00:00.000Z");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("returns 'Today' for dates from today", () => {
    it("returns Today for a date earlier today", () => {
      const earlier = new Date("2025-06-15T08:00:00.000Z");
      expect(formatLastActivity(earlier.toISOString())).toBe("Today");
    });

    it("returns Today for a date just moments ago", () => {
      const justNow = new Date("2025-06-15T11:59:00.000Z");
      expect(formatLastActivity(justNow.toISOString())).toBe("Today");
    });

    it("returns Today for midnight of the same day", () => {
      const midnight = new Date("2025-06-15T00:00:00.000Z");
      expect(formatLastActivity(midnight.toISOString())).toBe("Today");
    });
  });

  describe("returns 'Yesterday' for dates from yesterday", () => {
    it("returns Yesterday for a date 1 day ago", () => {
      const yesterday = new Date("2025-06-14T12:00:00.000Z");
      expect(formatLastActivity(yesterday.toISOString())).toBe("Yesterday");
    });

    it("returns Yesterday for late yesterday (24+ hours ago)", () => {
      // Must be at least 24 hours before "now" to count as 1 day ago
      const lateYesterday = new Date("2025-06-14T10:00:00.000Z");
      expect(formatLastActivity(lateYesterday.toISOString())).toBe("Yesterday");
    });

    it("returns Yesterday for early yesterday", () => {
      const earlyYesterday = new Date("2025-06-14T00:00:00.000Z");
      expect(formatLastActivity(earlyYesterday.toISOString())).toBe("Yesterday");
    });
  });

  describe("returns 'Xd ago' for dates 2-6 days ago", () => {
    it("returns '2d ago' for 2 days ago", () => {
      const twoDaysAgo = new Date("2025-06-13T12:00:00.000Z");
      expect(formatLastActivity(twoDaysAgo.toISOString())).toBe("2d ago");
    });

    it("returns '3d ago' for 3 days ago", () => {
      const threeDaysAgo = new Date("2025-06-12T12:00:00.000Z");
      expect(formatLastActivity(threeDaysAgo.toISOString())).toBe("3d ago");
    });

    it("returns '6d ago' for 6 days ago", () => {
      const sixDaysAgo = new Date("2025-06-09T12:00:00.000Z");
      expect(formatLastActivity(sixDaysAgo.toISOString())).toBe("6d ago");
    });
  });

  describe("returns 'Xw ago' for dates 7-29 days ago", () => {
    it("returns '1w ago' for 7 days ago", () => {
      const oneWeekAgo = new Date("2025-06-08T12:00:00.000Z");
      expect(formatLastActivity(oneWeekAgo.toISOString())).toBe("1w ago");
    });

    it("returns '1w ago' for 13 days ago (still 1 week)", () => {
      const thirteenDaysAgo = new Date("2025-06-02T12:00:00.000Z");
      expect(formatLastActivity(thirteenDaysAgo.toISOString())).toBe("1w ago");
    });

    it("returns '2w ago' for 14 days ago", () => {
      const twoWeeksAgo = new Date("2025-06-01T12:00:00.000Z");
      expect(formatLastActivity(twoWeeksAgo.toISOString())).toBe("2w ago");
    });

    it("returns '3w ago' for 21 days ago", () => {
      const threeWeeksAgo = new Date("2025-05-25T12:00:00.000Z");
      expect(formatLastActivity(threeWeeksAgo.toISOString())).toBe("3w ago");
    });

    it("returns '4w ago' for 29 days ago", () => {
      const fourWeeksAgo = new Date("2025-05-17T12:00:00.000Z");
      expect(formatLastActivity(fourWeeksAgo.toISOString())).toBe("4w ago");
    });
  });

  describe("returns formatted date for dates 30+ days ago", () => {
    it("returns formatted date for exactly 30 days ago", () => {
      const thirtyDaysAgo = new Date("2025-05-16T12:00:00.000Z");
      expect(formatLastActivity(thirtyDaysAgo.toISOString())).toBe("May 16");
    });

    it("returns formatted date for dates several months ago", () => {
      const monthsAgo = new Date("2025-01-15T12:00:00.000Z");
      expect(formatLastActivity(monthsAgo.toISOString())).toBe("Jan 15");
    });

    it("returns formatted date for dates from a previous year", () => {
      const lastYear = new Date("2024-12-25T12:00:00.000Z");
      expect(formatLastActivity(lastYear.toISOString())).toBe("Dec 25");
    });
  });
});
