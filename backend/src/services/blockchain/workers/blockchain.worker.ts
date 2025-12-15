import { Job } from "bullmq";
import { BlockchainJobData } from "../queue/blockchain.queue";
import { logger } from "../../../shared/utils/logger";
import TransactionService from "../services/transaction.service";
import ContractService from "../services/contract.service";
import IPFSService from "../services/ipfs.service";
import prisma from "../../../config/database";
import { SocketService } from "../../generation/socket/socket.service";

export class BlockchainWorker {
  private socketService?: SocketService;
  constructor(socketService?: SocketService) {
    this.socketService = socketService;
  }

  async process(job: Job<BlockchainJobData>) {
    const { type, payload } = job.data;
    const jobId = job.id?.toString() || "unknown";
    logger.info("Processing blockchain job", type, { jobId });
    try {
      // Emit job progress start
      try {
        this.socketService?.emitJobProgress(jobId, {
          status: "processing",
          progress: 5,
          currentStep: `Starting ${type}`,
        });
      } catch (e) {}

      if (type === "deploy") {
        // payload: { datasetId, tokenName, tokenSymbol, userId }
        const { datasetId, tokenName, tokenSymbol, userId } = payload;
        // Load dataset & user
        const dataset = await prisma.dataset.findUnique({
          where: { id: datasetId },
        });
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!dataset || !user)
          throw new Error("Dataset or user not found for deploy job");

        // Upload metadata to IPFS (similar to controller)
        const ipfs = IPFSService; // IPFSService default export is an instance
        const metadata = {
          name: tokenName,
          description: dataset.description,
          image: `ipfs://placeholder`,
          attributes: [
            { trait_type: "Quality Score", value: dataset.qualityScore },
            { trait_type: "Row Count", value: dataset.rowCount },
            { trait_type: "Category", value: dataset.category },
          ],
          external_url: `${process.env.FRONTEND_URL}/marketplace/${datasetId}`,
        };
        const metadataURI = await ipfs.uploadMetadata(metadata);

        // Deploy bonding curve via ContractService
        const contractService = ContractService; // ContractService default export is an instance
        const deployment = await contractService.deployBondingCurve({
          name: tokenName,
          symbol: tokenSymbol,
          metadataURI,
          creatorAddress: user.walletAddress,
        });

        // Persist bonding curve
        const bondingCurve = await prisma.bondingCurve.create({
          data: {
            datasetId,
            contractAddress: deployment.contractAddress,
            creatorAddress: user.walletAddress,
            tokenName,
            tokenSymbol,
            deploymentTxHash: deployment.txHash,
          },
        });

        // Update dataset NFT fields and userDataset status
        await prisma.dataset.update({
          where: { id: datasetId },
          data: {
            isNft: true,
            nftContractAddress: process.env.DATASET_NFT_ADDRESS,
            nftTokenId: deployment.nftTokenId,
          },
        });
        await prisma.userDataset.updateMany({
          where: { datasetId },
          data: { status: "bonding", publishedAt: new Date() },
        });

        // Emit job success and dataset details
        try {
          this.socketService?.emitJobProgress(jobId, {
            status: "completed",
            progress: 100,
            currentStep: "Deployment complete",
            bondingCurve: {
              id: bondingCurve.id,
              contractAddress: deployment.contractAddress,
            },
          });
        } catch (e) {}
      } else if (type === "mint") {
        // Mint NFT - not implemented here
        logger.info("Mint job received", { payload });
      } else if (type === "tx") {
        // payload: { tx }
        const receipt = await TransactionService.sendTransaction(payload.tx);
        // Emit completion
        try {
          this.socketService?.emitJobProgress(jobId, {
            status: "completed",
            progress: 100,
            currentStep: "Transaction sent",
            receipt,
          });
        } catch (e) {}
      }
    } catch (e) {
      logger.error("Blockchain worker error", e);
      try {
        this.socketService?.emitJobProgress(job.id?.toString() || "unknown", {
          status: "failed",
          progress: 0,
          currentStep: "Error",
          error: (e as Error).message,
        });
      } catch (er) {}
      throw e;
    }
  }
}

// Export a singleton worker instance for runtime usage
export default new BlockchainWorker();
