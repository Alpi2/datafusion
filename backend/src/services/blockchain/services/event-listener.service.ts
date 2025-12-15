import { logger } from "../../../shared/utils/logger";
import prisma from "../../../config/database";
import { JsonRpcProvider, Contract, formatEther, parseEther } from "ethers";
import { loadAbi } from "../utils/contract-abis";
import { socketService } from "../../../app";

type ContractMap = Map<string, Contract>;

export class EventListenerService {
  private provider: JsonRpcProvider;
  private abi: any | null = null;
  private listening = false;
  private contracts: ContractMap = new Map();

  constructor() {
    this.provider = new JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || process.env.POLYGON_MUMBAI_RPC
    );
    this.abi = loadAbi("BondingCurve");
  }

  /** Start listening to on-chain events for all known bonding curves */
  async start() {
    if (this.listening) return;
    if (!this.abi) {
      logger.warn("BondingCurve ABI not available; event listener not started");
      return;
    }

    this.listening = true;

    try {
      const curves = await prisma.bondingCurve.findMany();
      for (const curve of curves) {
        try {
          await this.subscribeCurve(curve.contractAddress);
        } catch (e) {
          logger.error("Failed to subscribe to curve events", {
            contract: curve.contractAddress,
            err: e,
          });
        }
      }

      // Periodically refresh subscriptions in case new curves were added
      setInterval(async () => {
        try {
          const current = await prisma.bondingCurve.findMany();
          for (const c of current) {
            if (!this.contracts.has(c.contractAddress)) {
              await this.subscribeCurve(c.contractAddress);
            }
          }
        } catch (e) {
          logger.error("Error refreshing curve subscriptions", e);
        }
      }, 30_000);
    } catch (error) {
      logger.error("Event listener start failed", error);
      this.listening = false;
    }
  }

  /** Subscribe to events for a specific bonding curve contract address */
  async subscribeCurve(contractAddress: string) {
    if (!this.abi) throw new Error("ABI not loaded");
    if (this.contracts.has(contractAddress)) return;

    const contract = new Contract(contractAddress, this.abi, this.provider);

    // TokensPurchased(address buyer, uint256 amount, uint256 cost, uint256 fee)
    contract.on(
      "TokensPurchased",
      async (
        buyer: string,
        amount: bigint,
        cost: bigint,
        fee: bigint,
        event: any
      ) => {
        try {
          const txHash = event?.transactionHash || "";
          const blockNumber = event?.blockNumber || 0;

          const amountStr = formatEther(amount);
          const costStr = formatEther(cost);
          const feeStr = formatEther(fee);
          const pricePerToken = Number(costStr) / Number(amountStr || "1");

          // Find the bonding curve DB entry
          const bc = await prisma.bondingCurve.findUnique({
            where: { contractAddress },
          });
          if (!bc) {
            logger.warn("TokensPurchased event for unknown bonding curve", {
              contractAddress,
            });
            return;
          }

          // Persist trade
          const trade = await prisma.trade.create({
            data: {
              bondingCurveId: bc.id,
              traderAddress: buyer,
              type: "buy",
              amount: amountStr,
              price: pricePerToken.toString(),
              totalValue: costStr,
              fee: feeStr,
              transactionHash: txHash,
              blockNumber: BigInt(blockNumber) as any,
            },
          });

          // Update bonding curve stats (supply, price, market cap, volume)
          let currentPriceStr = undefined;
          let marketCapStr = undefined;
          try {
            const totalSupply: bigint = await contract.totalSupply();
            const supplyStr = formatEther(totalSupply);
            const currentPrice: bigint = await contract.calculateBuyPrice(
              parseEther("1")
            );
            currentPriceStr = formatEther(currentPrice);
            const marketCap = await this.provider.getBalance(contractAddress);
            marketCapStr = formatEther(marketCap);

            await prisma.bondingCurve.update({
              where: { id: bc.id },
              data: {
                currentSupply: supplyStr,
                currentPrice: currentPriceStr,
                marketCap: marketCapStr,
                totalVolume: { increment: parseFloat(costStr) },
              },
            });
          } catch (e) {
            logger.error(
              "Failed updating bonding curve stats after purchase",
              e
            );
          }

          // Create an earning record for the creator (fee)
          try {
            const creatorUser = await prisma.user.findUnique({
              where: { walletAddress: bc.creatorAddress },
            });
            if (!creatorUser) {
              logger.warn("Creator user not found; skipping earning creation", {
                creatorAddress: bc.creatorAddress,
                contractAddress,
              });
            } else {
              await prisma.earning.create({
                data: {
                  userId: creatorUser.id,
                  datasetId: bc.datasetId,
                  amount: feeStr,
                  type: "creator_fee",
                  source: "bonding_curve",
                  transactionHash: txHash,
                },
              });
            }
          } catch (e) {
            logger.warn("Failed to create earning for creator", {
              err: e,
              creator: bc.creatorAddress,
            });
          }

          // Emit socket event to the dataset-specific channel with { type, data }
          try {
            const channel = `bonding:${bc.datasetId}`;
            const payload = {
              type: "buy",
              data: {
                trade,
                price: currentPriceStr,
                marketCap: marketCapStr,
              },
            };

            // Emit to Socket.io room if available
            try {
              const io = socketService?.getIO();
              if (io) io.to(channel).emit(channel, payload);
            } catch (e) {
              logger.warn(
                "Failed to emit socket.io event for TokensPurchased",
                e
              );
            }

            // Also emit internally for SSE or non-socket clients
            try {
              const emitter = socketService?.getEmitter();
              if (emitter) emitter.emit(channel, payload);
            } catch (e) {
              logger.warn("Emitter failed for TokensPurchased", e);
            }
          } catch (e) {
            logger.warn("Socket emit failed for TokensPurchased", e);
          }
        } catch (err) {
          logger.error("Error handling TokensPurchased event", err);
        }
      }
    );

    // TokensSold(address seller, uint256 amount, uint256 refund, uint256 fee)
    contract.on(
      "TokensSold",
      async (
        seller: string,
        amount: bigint,
        refund: bigint,
        fee: bigint,
        event: any
      ) => {
        try {
          const txHash = event?.transactionHash || "";
          const blockNumber = event?.blockNumber || 0;

          const amountStr = formatEther(amount);
          const refundStr = formatEther(refund);
          const feeStr = formatEther(fee);
          const pricePerToken = Number(refundStr) / Number(amountStr || "1");

          const bc = await prisma.bondingCurve.findUnique({
            where: { contractAddress },
          });
          if (!bc) {
            logger.warn("TokensSold event for unknown bonding curve", {
              contractAddress,
            });
            return;
          }

          const trade = await prisma.trade.create({
            data: {
              bondingCurveId: bc.id,
              traderAddress: seller,
              type: "sell",
              amount: amountStr,
              price: pricePerToken.toString(),
              totalValue: refundStr,
              fee: feeStr,
              transactionHash: txHash,
              blockNumber: BigInt(blockNumber) as any,
            },
          });

          // Update stats
          let currentPriceStrSell = undefined;
          let marketCapStrSell = undefined;
          try {
            const totalSupply: bigint = await contract.totalSupply();
            const supplyStr = formatEther(totalSupply);
            const currentPrice: bigint = await contract.calculateBuyPrice(
              parseEther("1")
            );
            currentPriceStrSell = formatEther(currentPrice);
            const marketCap = await this.provider.getBalance(contractAddress);
            marketCapStrSell = formatEther(marketCap);

            await prisma.bondingCurve.update({
              where: { id: bc.id },
              data: {
                currentSupply: supplyStr,
                currentPrice: currentPriceStrSell,
                marketCap: marketCapStrSell,
                totalVolume: { increment: parseFloat(refundStr) },
              },
            });
          } catch (e) {
            logger.error("Failed updating bonding curve stats after sell", e);
          }

          // Emit socket event to dataset-specific channel
          try {
            const channel = `bonding:${bc.datasetId}`;
            const payload = {
              type: "sell",
              data: {
                trade,
                price: currentPriceStrSell,
                marketCap: marketCapStrSell,
              },
            };

            try {
              const io = socketService?.getIO();
              if (io) io.to(channel).emit(channel, payload);
            } catch (e) {
              logger.warn("Failed to emit socket.io event for TokensSold", e);
            }

            try {
              const emitter = socketService?.getEmitter();
              if (emitter) emitter.emit(channel, payload);
            } catch (e) {
              logger.warn("Emitter failed for TokensSold", e);
            }
          } catch (e) {
            logger.warn("Socket emit failed for TokensSold", e);
          }
        } catch (err) {
          logger.error("Error handling TokensSold event", err);
        }
      }
    );

    // Graduated(address pool, uint256 liquidity)
    contract.on(
      "Graduated",
      async (pool: string, liquidity: bigint, event: any) => {
        try {
          const txHash = event?.transactionHash || "";
          const bc = await prisma.bondingCurve.findUnique({
            where: { contractAddress },
          });
          if (!bc) {
            logger.warn("Graduated event for unknown bonding curve", {
              contractAddress,
            });
            return;
          }

          await prisma.bondingCurve.update({
            where: { id: bc.id },
            data: {
              graduated: true,
              uniswapPoolAddress: pool,
              graduatedAt: new Date(),
            },
          });

          try {
            const channel = `bonding:${bc.datasetId}`;
            const payload = { type: "graduated", data: { pool, txHash } };
            try {
              const io = socketService?.getIO();
              if (io) io.to(channel).emit(channel, payload);
            } catch (e) {
              logger.warn("Failed to emit socket.io event for Graduated", e);
            }
            try {
              const emitter = socketService?.getEmitter();
              if (emitter) emitter.emit(channel, payload);
            } catch (e) {
              logger.warn("Emitter failed for Graduated", e);
            }
          } catch (e) {
            logger.warn("Socket emit failed for Graduated", e);
          }
        } catch (err) {
          logger.error("Error handling Graduated event", err);
        }
      }
    );

    this.contracts.set(contractAddress, contract);
    logger.info("Subscribed to bonding curve events", { contractAddress });
  }

  /** Stop listening and remove all listeners */
  async stop() {
    for (const [addr, c] of this.contracts.entries()) {
      try {
        c.removeAllListeners();
        this.contracts.delete(addr);
      } catch (e) {
        logger.warn("Failed to remove listeners for contract", {
          addr,
          err: e,
        });
      }
    }
    this.listening = false;
  }
}

export default new EventListenerService();
