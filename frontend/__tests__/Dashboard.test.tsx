import React from "react";
import { render, screen } from "@testing-library/react";

// Mock the dashboard client
jest.mock("@/lib/api/dashboardClient", () => ({
  getUserStats: jest.fn().mockResolvedValue({ totalEarnings: 100 }),
  getUserDatasets: jest
    .fn()
    .mockResolvedValue([
      {
        id: "d1",
        name: "A dataset",
        description: "desc",
        tier: "basic",
        status: "draft",
        category: "cat",
        marketCap: 0,
        earnings: 0,
        createdAt: new Date().toISOString(),
        deploymentType: "public",
      },
    ]),
  getEarningsSummary: jest
    .fn()
    .mockResolvedValue({ total: 100, monthly: 10, weekly: 2 }),
}));

import DashboardPage from "@/app/dashboard/page";

describe("Dashboard page", () => {
  test("renders loading and then data", async () => {
    render(<DashboardPage />);
    // While loading there should be a loading indicator text
    expect(screen.getByText(/İstatistikler yükleniyor/i)).toBeInTheDocument();
    // Wait for dataset title to appear
    const el = await screen.findByText(/A dataset/);
    expect(el).toBeInTheDocument();
  });
});
describe("Dashboard page (placeholder)", () => {
  it("placeholder test", () => {
    expect("dashboard").toContain("dash");
  });
});
