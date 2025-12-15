import BondingController from "../src/services/blockchain/controllers/bonding.controller";
import prisma from "../src/config/database";

describe("Bonding controller integration-like", () => {
  it("deploy happy path", async () => {
    // Mock dataset owned by user
    const dataset = {
      id: "d1",
      description: "desc",
      qualityScore: 90,
      rowCount: 100,
      category: "cat",
      creatorId: "user-1",
    } as any;
    jest.spyOn(prisma.dataset, "findUnique" as any).mockResolvedValue(dataset);

    // Mock IPFS upload and contract service
    const ipfs = require("../src/services/blockchain/services/ipfs.service");
    jest
      .spyOn(ipfs.IPFSService.prototype, "uploadMetadata")
      .mockResolvedValue("ipfs://meta");
    const contract = require("../src/services/blockchain/services/contract.service");
    jest
      .spyOn(contract.ContractService.prototype, "deployBondingCurve")
      .mockResolvedValue({
        contractAddress: "0xabc",
        txHash: "0xtx",
        nftTokenId: 1,
      });

    // spy on prisma create
    jest
      .spyOn(prisma.bondingCurve, "create" as any)
      .mockResolvedValue({ id: "bc1" } as any);
    jest.spyOn(prisma.dataset, "update" as any).mockResolvedValue({} as any);

    const req: any = {
      body: { datasetId: "d1", tokenName: "T", tokenSymbol: "TKN" },
      user: { id: "user-1" },
    };
    const res: any = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    const controller = BondingController as any;
    await controller.deploy(req, res);
    expect(prisma.dataset.findUnique).toHaveBeenCalled();
    expect(
      contract.ContractService.prototype.deployBondingCurve
    ).toHaveBeenCalled();
  });
});
