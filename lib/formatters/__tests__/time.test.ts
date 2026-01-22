import { formatDuration } from "../time";

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
