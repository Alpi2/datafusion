import { getUserStats } from "../src/services/dashboard/controllers/dashboard.controller";
import StatsService from "../src/services/dashboard/services/stats.service";

describe("Dashboard integration-like", () => {
  it("returns user stats via controller", async () => {
    const fakeStats = { totalEarnings: 100, datasets: 2 } as any;
    jest
      .spyOn(StatsService, "calculateUserStats" as any)
      .mockResolvedValue(fakeStats);

    const req: any = { params: { userId: "user-1" } };
    const res: any = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    await getUserStats(req, res, (err: any) => {
      if (err) throw err;
    });
    expect(StatsService.calculateUserStats).toHaveBeenCalledWith("user-1");
    expect(res.json).toHaveBeenCalledWith({ data: fakeStats, cached: false });
  });
});
