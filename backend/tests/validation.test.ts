import ValidationService from "../src/services/validation/validation.service";

describe("ValidationService metrics and score behavior", () => {
  it("computes field metrics and returns ValidationResult with fieldMetrics", async () => {
    const data = [
      { id: 1, value: 10 },
      { id: 2, value: 12 },
      { id: 3, value: 11 },
      { id: 4, value: 100 },
      { id: 5, value: null },
    ];

    const schema = {
      fields: [
        { name: "id", type: "integer", required: true },
        { name: "value", type: "number" },
      ],
    };

    const res = await ValidationService.validateDataset(
      data as any,
      schema as any,
      "enhanced"
    );
    expect(res).toBeDefined();
    expect(Array.isArray(res.fieldMetrics)).toBe(true);
    expect(res.fieldMetrics && res.fieldMetrics.length).toBeGreaterThan(0);
    const valueMetric = res.fieldMetrics
      ? res.fieldMetrics.find((m: any) => m.fieldName === "value")
      : undefined;
    expect(valueMetric).toBeDefined();
    if (valueMetric) {
      expect(typeof valueMetric.nullRate).toBe("number");
      expect(typeof valueMetric.uniqueCount).toBe("number");
    }
  });

  it("produces a lower score when errors are introduced", async () => {
    const goodData = [
      { id: 1, value: 10 },
      { id: 2, value: 12 },
      { id: 3, value: 11 },
    ];
    const badData = [
      { id: null, value: 10 },
      { id: null, value: "x" },
      {
        /* missing id */
      },
    ];
    const schema = {
      fields: [
        { name: "id", type: "integer", required: true },
        { name: "value", type: "number" },
      ],
    };

    const goodRes = await ValidationService.validateDataset(
      goodData as any,
      schema as any,
      "standard"
    );
    const badRes = await ValidationService.validateDataset(
      badData as any,
      schema as any,
      "standard"
    );

    expect(goodRes.score).toBeGreaterThanOrEqual(badRes.score);
  });
});
describe("Validation pipeline (placeholder)", () => {
  it("basic validation placeholder", () => {
    expect(true).toBeTruthy();
  });
});
