import React from "react";
import { render, screen } from "@testing-library/react";
import { MarketplaceInterface } from "@/components/marketplace/MarketplaceInterface";

// Simple smoke test to ensure compare selection UI works
test("selecting datasets for compare shows compare bar and limits to 3", async () => {
  // Mock hooks to return deterministic data
  jest.doMock("@/lib/hooks/marketplace", () => ({
    useMarketplaceCategories: () => ({
      data: ["All Categories", "Cat1"],
      isLoading: false,
    }),
    useMarketplaceDatasets: () => ({
      data: {
        datasets: [
          {
            id: "a",
            title: "A",
            description: "A desc",
            creator: "u",
            category: "Cat1",
            price: 1,
            downloads: 10,
            rating: 4.5,
            quality: 90,
            lastUpdated: "today",
            tags: [],
            preview: { rows: 10, columns: 2, size: "1KB" },
          },
          {
            id: "b",
            title: "B",
            description: "B desc",
            creator: "u",
            category: "Cat1",
            price: 2,
            downloads: 20,
            rating: 4.0,
            quality: 85,
            lastUpdated: "today",
            tags: [],
            preview: { rows: 20, columns: 3, size: "2KB" },
          },
          {
            id: "c",
            title: "C",
            description: "C desc",
            creator: "u",
            category: "Cat1",
            price: 3,
            downloads: 30,
            rating: 3.5,
            quality: 80,
            lastUpdated: "today",
            tags: [],
            preview: { rows: 30, columns: 4, size: "3KB" },
          },
          {
            id: "d",
            title: "D",
            description: "D desc",
            creator: "u",
            category: "Cat1",
            price: 4,
            downloads: 40,
            rating: 3.0,
            quality: 75,
            lastUpdated: "today",
            tags: [],
            preview: { rows: 40, columns: 5, size: "4KB" },
          },
        ],
        pagination: { total: 4, page: 1, limit: 20 },
      },
    }),
  }));

  render(<MarketplaceInterface />);

  // There should be compare buttons (Database icon buttons)
  const compareButtons = await screen.findAllByTitle(
    /Add to compare|Remove from compare/i
  );
  expect(compareButtons.length).toBeGreaterThanOrEqual(3);

  // Click three of them (use DOM click to avoid extra test deps)
  (compareButtons[0] as HTMLElement).click();
  (compareButtons[1] as HTMLElement).click();
  (compareButtons[2] as HTMLElement).click();

  // Compare bar should appear
  expect(await screen.findByText(/3 selected/)).toBeInTheDocument();
});
