import BondingController from "../src/services/blockchain/controllers/bonding.controller";

// Mock prisma and ContractService
jest.mock("../src/config/database", () => ({
  bondingCurve: {
    findUnique: jest
      .fn()
      .mockResolvedValue({
        contractAddress: "0xCAFE",
        currentSupply: 0,
        currentPrice: 0,
        marketCap: 0,
        totalVolume: 0,
        holderCount: 0,
        graduated: false,
      }),
  },
  dataset: {
    findFirst: jest
      .fn()
      .mockResolvedValue({
        id: "dataset1",
        description: "desc",
        qualityScore: 90,
        rowCount: 100,
        category: "cat",
      }),
  },
  user: {
    findUnique: jest
      .fn()
      .mockResolvedValue({ id: "user1", walletAddress: "0xabc" }),
  },
}));

jest.mock("../src/services/blockchain/services/contract.service", () => {
  return {
    ContractService: jest.fn().mockImplementation(() => ({
      getCurrentPrice: jest.fn().mockResolvedValue("0.5"),
      getMarketCap: jest.fn().mockResolvedValue("1000"),
      buyTokens: jest
        .fn()
        .mockResolvedValue(
          JSON.stringify({ to: "0xCAFE", data: "0xdata", value: "100" })
        ),
      sellTokens: jest
        .fn()
        .mockResolvedValue(
          JSON.stringify({ to: "0xCAFE", data: "0xdata", value: "0" })
        ),
      deployBondingCurve: jest
        .fn()
        .mockResolvedValue({
          contractAddress: "0xNEW",
          nftTokenId: "1",
          txHash: "0xtx",
        }),
    })),
  };
});

describe("BondingController", () => {
  it("getPrice returns contract data", async () => {
    const req: any = { params: { datasetId: "dataset1" } };
    const json = jest.fn();
    const res: any = { status: jest.fn().mockReturnThis(), json };
    await BondingController.getPrice(req as any, res as any);
    expect(json).toHaveBeenCalled();
    const payload = json.mock.calls[0][0];
    expect(payload).toHaveProperty("currentPrice");
  });
});
