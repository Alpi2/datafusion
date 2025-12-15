import { ethers } from "hardhat";
async function main() {
  console.log("🚀 Deploying DataFusion contracts...");
  // Deploy DatasetNFT
  const DatasetNFT = await ethers.getContractFactory("DatasetNFT");
  const nft = await DatasetNFT.deploy();
  await nft.waitForDeployment();
  console.log(`✅ DatasetNFT deployed: ${await nft.getAddress()}`);
  // Deploy BondingCurveFactory
  const BondingCurveFactory = await ethers.getContractFactory(
    "BondingCurveFactory"
  );
  const factory = await BondingCurveFactory.deploy(
    await nft.getAddress(),
    process.env.UNISWAP_V3_FACTORY!,
    process.env.UNISWAP_V3_POSITION_MANAGER!,
    process.env.WRAPPED_NATIVE!
  );
  await factory.waitForDeployment();
  console.log(`✅ BondingCurveFactory deployed: ${await factory.getAddress()}`);
  // Transfer NFT ownership to factory
  await nft.transferOwnership(await factory.getAddress());
  console.log("✅ NFT ownership transferred to factory");
  console.log("\n📝 Add these to your .env:");
  console.log(`DATASET_NFT_ADDRESS=${await nft.getAddress()}`);
  console.log(`BONDING_CURVE_FACTORY_ADDRESS=${await factory.getAddress()}`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
