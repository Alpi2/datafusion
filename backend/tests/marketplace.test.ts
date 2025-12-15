import request from "supertest";
import express from "express";
import { createMarketplaceRoutes } from "../../src/services/marketplace/routes/marketplace.routes";
import { MarketplaceController } from "../../src/services/marketplace/controllers/marketplace.controller";
import { WebhookController } from "../../src/services/marketplace/controllers/webhook.controller";

class MockMarketplaceController {
  async listDatasets(req: any, res: any) {
    return res.json({ success: true, datasets: [{ id: "d1", title: "Dataset 1" }] });
  }
  async searchDatasets(req: any, res: any) {
    return res.json({ success: true, datasets: [] });
  }
  async downloadDataset(req: any, res: any) {
    // simulate presigned url
    return res.json({ success: true, url: "https://example.com/download/d1" });
  }
}

describe("Marketplace routes (mocked)", () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    const controller = new MockMarketplaceController() as any;
    const webhook = new WebhookController({} as any);
    const router = createMarketplaceRoutes(controller, webhook);
    app.use("/api/marketplace", router);
  });

  test("GET /api/marketplace/datasets returns datasets", async () => {
    const res = await request(app).get("/api/marketplace/datasets");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.datasets)).toBe(true);
  });

  test("POST /api/marketplace/search validates request and returns OK", async () => {
    const res = await request(app).post("/api/marketplace/search").send({ query: "test" });
    expect(res.status).toBe(200);
  });

  test("GET /api/marketplace/datasets/:id/download returns presigned URL", async () => {
    const res = await request(app).get("/api/marketplace/datasets/d1/download");
    expect(res.status).toBe(200);
    expect(res.body.url).toContain("https://");
  });
});
describe('Marketplace tests (placeholder)', () => {
  it('basic sanity', () => {
    expect(1 + 1).toBe(2);
  });
});
