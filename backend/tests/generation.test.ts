import request from "supertest";
import express from "express";
import { createGenerationRoutes } from "../../src/services/generation/routes/generation.routes";

// Mock auth middleware used by routes
function mockAuth(req: any, res: any, next: any) {
  req.user = { userId: "test-user" };
  next();
}

class MockGenerationController {
  async create(req: any, res: any) {
    return res.status(201).json({ success: true, jobId: "job-123" });
  }
  async getStatus(req: any, res: any) {
    const { jobId } = req.params;
    if (jobId === "notfound") return res.status(404).json({ error: "Job not found" });
    return res.json({ success: true, job: { id: jobId, status: "pending" } });
  }
  async validate(req: any, res: any) {
    return res.json({ success: true, validation: { valid: true }, compliance: [] });
  }
}

describe("Generation routes integration (mocked)", () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // mount routes with mock controller and inject auth middleware
    const genController = new MockGenerationController();
    const router = createGenerationRoutes(genController as any);
    // simple replacement: set user for all requests
    app.use((req, res, next) => {
      req.user = { userId: "test-user" };
      next();
    });
    app.use("/api/generation", router);
  });

  test("POST /api/generation/create creates a job", async () => {
    const res = await request(app)
      .post("/api/generation/create")
      .send({ prompt: "This is a valid prompt with length > 10", tier: "basic" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("jobId");
  });

  test("GET /api/generation/status/:jobId returns job status", async () => {
    const res = await request(app).get("/api/generation/status/job-123");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("job");
    expect(res.body.job.id).toBe("job-123");
  });

  test("POST /api/generation/validate validates data", async () => {
    const res = await request(app).post("/api/generation/validate").send({ data: [{ a: 1 }] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("validation");
  });
});
describe('Generation pipeline (placeholder)', () => {
  it('has a placeholder test', () => {
    expect(true).toBe(true);
  });
});
