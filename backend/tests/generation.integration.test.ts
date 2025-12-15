import { GenerationController } from "../src/services/generation/controllers/generation.controller";
import { GenerationQueue } from "../src/services/generation/queue/generation.queue";
import prisma from "../src/config/database";

describe("Generation controller integration-like", () => {
  it("creates a generation job and queues it", async () => {
    const mockQueue: any = { addJob: jest.fn().mockResolvedValue(true) };
    const controller = new GenerationController(mockQueue as GenerationQueue);

    const fakeJob = { id: "job-1" } as any;
    jest
      .spyOn(prisma.generationJob, "create" as any)
      .mockResolvedValue(fakeJob);

    const req: any = {
      body: { prompt: "test prompt", tier: "basic" },
      user: { userId: "user-1" },
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await controller.create(req, res);

    expect(prisma.generationJob.create).toHaveBeenCalled();
    expect(mockQueue.addJob).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
