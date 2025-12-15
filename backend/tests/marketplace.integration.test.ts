import { MarketplaceController } from "../src/services/marketplace/controllers/marketplace.controller";
import prisma from "../src/config/database";
import { StripeService } from "../src/services/marketplace/payment/stripe.service";
import { StorageService } from "../src/services/storage/storage.service";

describe("Marketplace integration-like", () => {
  it("initiates purchase and generates download with earnings recording", async () => {
    // Prepare controller with mock services
    const searchService: any = { search: jest.fn() };
    const stripe: any = {
      createPaymentIntent: jest
        .fn()
        .mockResolvedValue({ clientSecret: "sec", paymentIntentId: "pi_1" }),
    };
    const storage: any = {
      getPresignedUrl: jest.fn().mockResolvedValue("https://example.com/file"),
    };
    const controller = new MarketplaceController(
      searchService,
      stripe as StripeService,
      storage as StorageService
    );

    // Mock dataset and purchase lookup
    const dataset = { id: "ds1", title: "Test", price: 10 } as any;
    jest.spyOn(prisma.dataset, "findUnique" as any).mockResolvedValue(dataset);
    jest.spyOn(prisma.purchase, "findUnique" as any).mockResolvedValue(null);
    jest
      .spyOn(stripe, "createPaymentIntent")
      .mockResolvedValue({ clientSecret: "sec", paymentIntentId: "pi_1" });

    const req: any = {
      params: { datasetId: "ds1" },
      user: { userId: "user-1" },
    };
    const res: any = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    await controller.purchaseDataset(req, res);
    expect(stripe.createPaymentIntent).toHaveBeenCalled();

    // Now simulate download path where purchase exists and earnings should be recorded
    const purchase = {
      id: "p1",
      buyerId: "user-1",
      datasetId: "ds1",
      pricePaid: 10,
    } as any;
    jest
      .spyOn(prisma.purchase, "findUnique" as any)
      .mockResolvedValue(purchase);
    jest.spyOn(prisma.earning, "findFirst" as any).mockResolvedValue(null);
    const recSpy = jest.spyOn(
      require("../src/services/dashboard/services/earnings.service").default,
      "recordEarning"
    );
    jest
      .spyOn(prisma.dataset, "findUnique" as any)
      .mockResolvedValue({
        id: "ds1",
        creatorId: "creator-1",
        fileUrl: "file://x",
      } as any);
    const dlReq: any = { params: { id: "ds1" }, user: { userId: "user-1" } };
    await controller.downloadDataset(dlReq, res);
    expect(storage.getPresignedUrl).toHaveBeenCalled();
    expect(recSpy).toHaveBeenCalled();
  });
});
