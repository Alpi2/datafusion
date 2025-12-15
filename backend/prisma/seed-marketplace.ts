import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a demo user
  const user = await prisma.user.upsert({
    where: { username: "alice" },
    update: {},
    create: {
      walletAddress: "0x" + "1".repeat(40),
      username: "alice",
      email: "alice@example.com",
      profileImageUrl: null,
      bio: "Seed user",
    },
  });

  // Create a demo dataset
  const dataset = await prisma.dataset.create({
    data: {
      creatorId: user.id,
      title: "Sample Dataset (seed)",
      description: "This is a small sample dataset created by the seed script.",
      category: "test",
      tags: ["sample", "seed"],
      price: "9.99",
      qualityScore: 80,
      previewData: { rows: [{ id: 1, value: "example" }] },
      fileUrl: "s3://datafusion-datasets/sample.csv",
      fileSize: BigInt(1024),
      rowCount: 100,
      columnCount: 5,
    },
  });

  console.log("Seed completed:", { userId: user.id, datasetId: dataset.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
