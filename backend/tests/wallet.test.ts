import WalletController from "../src/services/blockchain/controllers/wallet.controller";

jest.mock("../src/config/database", () => ({
  userWallet: {
    findMany: jest
      .fn()
      .mockResolvedValue([
        {
          id: "w1",
          address: "0x123",
          provider: "walletconnect",
          isActive: true,
        },
      ]),
  },
  user: {
    findUnique: jest
      .fn()
      .mockResolvedValue({ id: "user1", walletAddress: "0xabc" }),
  },
}));

describe("WalletController", () => {
  it("lists wallets including primary", async () => {
    const req: any = { user: { id: "user1" } };
    const json = jest.fn();
    const res: any = { json };
    await WalletController.list(req as any, res as any);
    expect(json).toHaveBeenCalled();
    const payload = json.mock.calls[0][0];
    expect(payload).toHaveProperty("success", true);
    expect(Array.isArray(payload.wallets)).toBe(true);
    expect(payload.wallets.length).toBeGreaterThan(0);
  });
});
