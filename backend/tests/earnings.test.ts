import EarningsService from "../src/services/dashboard/services/earnings.service";

jest.mock("../src/config/database", () => ({
  $transaction: jest.fn().mockImplementation(async (fn: any) => {
    // simulate transaction by calling the provided function with a tx-like object
    const tx = {
      earning: { create: jest.fn().mockResolvedValue({ id: "e1", amount: 1 }) },
      userDataset: { updateMany: jest.fn().mockResolvedValue(true) },
      user: { updateMany: jest.fn().mockResolvedValue(true) },
      activityLog: { create: jest.fn().mockResolvedValue(true) },
    };
    return fn(tx);
  }),
}));

jest.mock("../src/services/dashboard/utils/cache.util", () => ({
  default: { invalidateEarnings: jest.fn().mockResolvedValue(null) },
}));

describe("EarningsService", () => {
  it("records an earning and returns created object", async () => {
    const res = await EarningsService.recordEarning({
      userId: "user1",
      amount: 1,
      type: "test",
    });
    expect(res).toBeDefined();
    expect(res).toHaveProperty("id");
  });
});
