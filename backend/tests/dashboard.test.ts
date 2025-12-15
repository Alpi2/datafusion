import request from "supertest";
import prisma from "../src/config/database";

// Mock auth middleware to allow setting test user via header
jest.mock("../src/services/auth/middleware/auth.middleware", () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    const uid = req.headers["x-test-user-id"];
    req.user = { id: uid || null, isAdmin: uid === "admin" };
    next();
  },
}));

import app from "../src/app";

describe("Dashboard API (integration tests)", () => {
  let user: any;
  let otherUser: any;
  let dataset: any;

  beforeAll(async () => {
    // ensure clean state for tests
    await prisma.$connect();
    // create users
    user = await prisma.user.create({
      data: {
        walletAddress: `0xtest${Date.now()}`,
        username: `testuser_${Date.now()}`,
      } as any,
    });
    otherUser = await prisma.user.create({
      data: {
        walletAddress: `0xother${Date.now()}`,
        username: `other_${Date.now()}`,
      } as any,
    });

    dataset = await prisma.dataset.create({
      data: {
        creatorId: user.id,
        title: "Integration Test Dataset",
        description: "Seeded for tests",
        category: "test",
        tags: ["test"],
        price: 1.0 as any,
        qualityScore: 90,
        downloadCount: 0,
        rating: 0 as any,
        reviewCount: 0,
        previewData: {},
        fileUrl: "",
        fileSize: BigInt(0),
        rowCount: 10,
        columnCount: 3,
        status: "draft",
      } as any,
    });
  });

  afterAll(async () => {
    // cleanup created records
    await prisma.earning.deleteMany({ where: { userId: user.id } });
    await prisma.purchase.deleteMany({ where: { buyerId: user.id } });
    await prisma.userDataset.deleteMany({ where: { userId: user.id } });
    await prisma.dataset.deleteMany({ where: { creatorId: user.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [user.id, otherUser.id] } },
    });
    await prisma.$disconnect();
  });

  test("GET /api/dashboard/stats/:userId returns 200 and stats", async () => {
    const res = await request(app)
      .get(`/api/dashboard/stats/${user.id}`)
      .set("x-test-user-id", user.id)
      .expect(200);

    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("totalEarnings");
  });

  test("GET /api/dashboard/datasets/:userId returns datasets", async () => {
    const res = await request(app)
      .get(`/api/dashboard/datasets/${user.id}`)
      .set("x-test-user-id", user.id)
      .expect(200);

    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("POST /api/dashboard/datasets/publish creates UserDataset and ActivityLog", async () => {
    const res = await request(app)
      .post("/api/dashboard/datasets/publish")
      .set("x-test-user-id", user.id)
      .send({
        userId: user.id,
        datasetId: dataset.id,
        deploymentType: "public",
      })
      .expect(200);

    expect(res.body).toHaveProperty("data");

    // verify userDataset and activity log created
    const ud = await prisma.userDataset.findUnique({
      where: { datasetId: dataset.id },
    });
    expect(ud).not.toBeNull();
    const logs = await prisma.activityLog.findMany({
      where: { userId: user.id, action: "dataset_published" },
    });
    expect(logs.length).toBeGreaterThan(0);
  });

  test("GET /api/dashboard/earnings/:userId returns earnings summary", async () => {
    const res = await request(app)
      .get(`/api/dashboard/earnings/${user.id}`)
      .set("x-test-user-id", user.id)
      .expect(200);

    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("total");
  });

  test("GET /api/dashboard/earnings/:userId is forbidden for other users", async () => {
    await request(app)
      .get(`/api/dashboard/earnings/${user.id}`)
      .set("x-test-user-id", otherUser.id)
      .expect(403);
  });

  test("GET /api/analytics/performance/:userId returns metrics", async () => {
    const res = await request(app)
      .get(`/api/analytics/performance/${user.id}`)
      .set("x-test-user-id", user.id)
      .expect(200);

    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("totalRevenue");
  });

  test.skip("Caching works and invalidation (manual verification)", async () => {
    // This test is a placeholder: caching behavior depends on Redis and environment.
    // Implement timing/assertions after test infra for Redis is available.
  });

  test("Authorization prevents other users accessing private endpoints", async () => {
    // otherUser should be forbidden when accessing user's stats
    await request(app)
      .get(`/api/dashboard/stats/${user.id}`)
      .set("x-test-user-id", otherUser.id)
      .expect(403);
  });
});
