import TransactionsController from "../src/services/blockchain/controllers/transactions.controller";

// Mock prisma to return predictable data
jest.mock("../src/config/database", () => ({
  trade: {
    findMany: jest
      .fn()
      .mockResolvedValue([
        {
          id: "t1",
          transactionHash: "0xabc",
          amount: 1,
          price: 0.1,
          fee: 0.001,
          blockNumber: 123,
          createdAt: new Date(),
          bondingCurve: { datasetId: "d1" },
        },
      ]),
  },
  purchase: {
    findMany: jest
      .fn()
      .mockResolvedValue([
        {
          id: "p1",
          transactionHash: "0xdef",
          pricePaid: 10,
          datasetId: "d2",
          purchasedAt: new Date(),
        },
      ]),
  },
  earning: {
    findMany: jest
      .fn()
      .mockResolvedValue([
        {
          id: "e1",
          transactionHash: "0xfee",
          amount: 0.5,
          datasetId: "d1",
          createdAt: new Date(),
        },
      ]),
  },
}));

describe("TransactionsController", () => {
  it("aggregates trades, purchases and earnings", async () => {
    const req: any = { user: { id: "user1" } };
    const json = jest.fn();
    const res: any = { json };
    await TransactionsController.list(req as any, res as any);
    expect(json).toHaveBeenCalled();
    const payload = json.mock.calls[0][0];
    expect(payload).toHaveProperty("success", true);
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.items.length).toBeGreaterThan(0);
  });
});
