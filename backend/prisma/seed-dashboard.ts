import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedDashboard() {
  console.log("Seeding dashboard data...");

  // Create sample users
  const users = [] as any[];
  for (let i = 1; i <= 3; i++) {
    const u = await prisma.user.create({
      data: {
        walletAddress: `0x0000000000000000000000000000000000000${i}`,
        username: `tester${i}`,
        email: `tester${i}@example.com`,
        profileImageUrl: null,
        bio: `Test user ${i}`,
      },
    });
    users.push(u);
  }

  // Create sample datasets and userDatasets
  const datasets: any[] = [];
  for (const u of users) {
    for (let j = 1; j <= 2; j++) {
      const ds = await prisma.dataset.create({
        data: {
          creatorId: u.id,
          title: `Sample Dataset ${u.username}-${j}`,
          description: `Auto-generated sample dataset ${j} for ${u.username}`,
          category: j === 1 ? "finance" : "health",
          tags: ["sample", "auto"],
          price: (rand(5, 50) + Math.random()).toFixed(2) as any,
          qualityScore: rand(70, 99),
          downloadCount: rand(0, 20),
          rating: (Math.floor(Math.random() * 40) + 60) / 10,
          reviewCount: rand(0, 10),
          previewData: [{ example: true }],
          fileUrl: "",
          fileSize: BigInt(rand(1000, 1000000)),
          rowCount: rand(10, 1000),
          columnCount: rand(3, 12),
          status: j === 1 ? "active" : "draft",
        },
      });
      datasets.push(ds);

      // create userDataset
      await prisma.userDataset.create({
        data: {
          userId: u.id,
          datasetId: ds.id,
          status: ds.status,
          bondingProgress: 0,
          marketCap: 0,
          totalEarnings: 0,
          tradingVolume: 0,
          holderCount: rand(0, 100),
          deploymentType: "public",
        } as any,
      });
    }
  }

  // Create sample purchases and earnings across last 30 days
  const now = new Date();
  const purchases: any[] = [];
  for (let d = 0; d < 30; d++) {
    const day = new Date(now);
    day.setDate(now.getDate() - d);
    const numPurchases = rand(0, 3);
    for (let p = 0; p < numPurchases; p++) {
      const buyer = users[rand(0, users.length - 1)];
      const dataset = datasets[rand(0, datasets.length - 1)];
      const pricePaid = Number((Math.random() * 50 + 1).toFixed(2));
      const purchase = await prisma.purchase.create({
        data: {
          buyerId: buyer.id,
          datasetId: dataset.id,
          pricePaid,
          paymentMethod: "stripe",
          purchasedAt: day,
        } as any,
      });
      purchases.push(purchase);

      // create earnings for dataset owner: split events (download + trading + bonus)
      const downloadFee = Number((pricePaid * 0.3).toFixed(8));
      const tradingFee = Number((pricePaid * 0.6).toFixed(8));
      const bonus = Number((pricePaid * 0.1).toFixed(8));

      await prisma.earning.create({
        data: {
          userId: dataset.creatorId,
          datasetId: dataset.id,
          amount: downloadFee,
          type: "download",
          source: purchase.id,
          createdAt: day,
        } as any,
      });
      await prisma.earning.create({
        data: {
          userId: dataset.creatorId,
          datasetId: dataset.id,
          amount: tradingFee,
          type: "trading_fee",
          source: purchase.id,
          createdAt: day,
        } as any,
      });
      await prisma.earning.create({
        data: {
          userId: dataset.creatorId,
          datasetId: dataset.id,
          amount: bonus,
          type: "bonus",
          source: purchase.id,
          createdAt: day,
        } as any,
      });
    }
  }

  // Create some activity logs
  for (const u of users) {
    await prisma.activityLog.createMany({
      data: [
        {
          userId: u.id,
          action: "dataset_published",
          details: { note: "Initial publish" },
          createdAt: new Date(),
        },
        {
          userId: u.id,
          action: "profile_updated",
          details: { note: "Updated bio" },
          createdAt: new Date(),
        },
      ] as any,
    });
  }

  // Platform stats for last 30 days
  const platformOps: any[] = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    platformOps.push({
      date,
      totalUsers: users.length + rand(0, 3),
      totalDatasets: datasets.length,
      totalVolume: Number((Math.random() * 1000).toFixed(2)),
      totalEarnings: Number((Math.random() * 500).toFixed(8)),
      activeUsers24h: rand(0, users.length),
      newDatasets24h: rand(0, 2),
      totalPurchases24h: rand(0, 5),
      createdAt: new Date(),
    } as any);
  }
  for (const op of platformOps) {
    // use upsert to avoid unique date conflicts
    await prisma.platformStats.upsert({
      where: { date: op.date },
      update: op,
      create: op,
    } as any);
  }

  console.log("Seeding completed.");
}

seedDashboard()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
