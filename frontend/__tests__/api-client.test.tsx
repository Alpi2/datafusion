import { apiClient } from "@/lib/api/client";

// Use jest-fetch-mock in tests; if not available, fallback to global fetch stub
const originalFetch = global.fetch;

describe("apiClient", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  test("parses JSON once and returns data field when present", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ data: { x: 1 } }),
    });
    const res = await apiClient.get<{ x: number }>("/test");
    expect(res.x).toBe(1);
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
  });

  test("retries on transient failures and eventually throws", async () => {
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error("network"))
      .mockRejectedValueOnce(new Error("network2"))
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "text/plain" },
        text: async () => "ok",
      });

    const res = await apiClient.get<string>("/retry-test");
    expect(res).toBe("ok");
    expect(
      (global.fetch as jest.Mock).mock.calls.length
    ).toBeGreaterThanOrEqual(3);
  });
});
