import GasController from "../src/services/blockchain/controllers/gas.controller";

describe("GasController", () => {
  it("returns estimates shape", async () => {
    const res: any = { json: jest.fn() };
    await GasController.get({} as any, res as any);
    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveProperty("success", true);
    expect(payload).toHaveProperty("estimates");
    expect(payload.estimates).toHaveProperty("slow");
    expect(payload.estimates).toHaveProperty("average");
    expect(payload.estimates).toHaveProperty("fast");
  });
});
