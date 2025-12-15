import {
  JsonRpcProvider,
  Wallet,
  Contract,
  parseEther,
  formatEther,
} from "ethers";
import { loadAbi } from "../utils/contract-abis";
import { logger } from "../../../shared/utils/logger";

export class ContractService {
  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private factoryContract: Contract | null = null;
  private nftContract: Contract | null = null;

  constructor() {
    this.provider = new JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || process.env.POLYGON_MUMBAI_RPC
    );
    const pk = process.env.DEPLOYER_PRIVATE_KEY || "";
    if (!pk || pk === "[REDACTED]") {
      // Do not create a wallet in dev when private key is not provided.
      // Leaving wallet undefined/null prevents invalid private key crashes.
      // @ts-ignore
      this.wallet = null;
      logger.warn("DEPLOYER_PRIVATE_KEY not set or redacted; blockchain wallet disabled in this environment.");
    } else {
      this.wallet = new Wallet(pk, this.provider);
    }

    // Load ABIs from artifacts if present
    const factoryAbi = loadAbi("BondingCurveFactory");
    const nftAbi = loadAbi("DatasetNFT");

    if (process.env.BONDING_CURVE_FACTORY_ADDRESS && factoryAbi && this.wallet) {
      this.factoryContract = new Contract(
        process.env.BONDING_CURVE_FACTORY_ADDRESS,
        factoryAbi,
        this.wallet
      );
    }
    if (process.env.DATASET_NFT_ADDRESS && nftAbi && this.wallet) {
      this.nftContract = new Contract(
        process.env.DATASET_NFT_ADDRESS,
        nftAbi,
        this.wallet
      );
    }
  }

  async deployBondingCurve(params: {
    name: string;
    symbol: string;
    metadataURI: string;
    creatorAddress: string;
  }): Promise<{ contractAddress: string; nftTokenId: string; txHash: string }> {
    if (!this.factoryContract)
      throw new Error("Factory contract not configured");
    try {
      const deploymentFee = parseEther("100"); // 100 $INFL

      const tx = await this.factoryContract.deployBondingCurve(
        params.name,
        params.symbol,
        params.metadataURI,
        { value: deploymentFee }
      );
      const receipt = await tx.wait();

      // Try to decode BondingCurveDeployed event
      let contractAddress = "";
      let nftTokenId: any = null;
      for (const log of receipt.logs) {
        try {
          const parsed = this.factoryContract.interface.parseLog(log);
          if (parsed && parsed.name === "BondingCurveDeployed") {
            contractAddress = parsed.args[0];
            nftTokenId = parsed.args[2];
            break;
          }
        } catch (e) {
          // ignore unparsable logs
        }
      }

      return {
        contractAddress,
        nftTokenId: nftTokenId ? nftTokenId.toString() : "",
        txHash: receipt.transactionHash || receipt.transactionHash || tx.hash,
      };
    } catch (error: any) {
      logger.error("Bonding curve deployment failed", error);
      throw new Error("Contract deployment failed");
    }
  }

  async buyTokens(contractAddress: string, amount: string): Promise<string> {
    // NOTE: Backend should not use a custodial signer to execute buy on behalf of users
    // Prepare unsigned transaction payload so the client can sign and send it from their wallet.
    const abi = loadAbi("BondingCurve");
    if (!abi) throw new Error("BondingCurve ABI not found");
    const bondingCurve = new Contract(contractAddress, abi, this.provider);

    const amountParsed = parseEther(amount);
    const cost: bigint = await bondingCurve.calculateBuyPrice(amountParsed);
    const fee = (cost * 150n) / 10000n; // 1.5%
    const totalCost = cost + fee;

    // Build calldata for client to sign: buy(amount)
    const data = bondingCurve.interface.encodeFunctionData("buy", [
      amountParsed,
    ]);
    return JSON.stringify({
      to: contractAddress,
      data,
      value: totalCost.toString(),
    });
  }

  async sellTokens(contractAddress: string, amount: string): Promise<string> {
    // Prepare unsigned transaction payload for sell — client must sign and send from their wallet
    const abi = loadAbi("BondingCurve");
    if (!abi) throw new Error("BondingCurve ABI not found");
    const bondingCurve = new Contract(contractAddress, abi, this.provider);

    const amountParsed = parseEther(amount);
    const data = bondingCurve.interface.encodeFunctionData("sell", [
      amountParsed,
    ]);
    return JSON.stringify({ to: contractAddress, data, value: "0" });
  }

  async getCurrentPrice(contractAddress: string): Promise<string> {
    const abi = loadAbi("BondingCurve");
    if (!abi) throw new Error("BondingCurve ABI not found");
    const bondingCurve = new Contract(contractAddress, abi, this.provider);
    const price: bigint = await bondingCurve.calculateBuyPrice(parseEther("1"));
    return formatEther(price);
  }

  async getMarketCap(contractAddress: string): Promise<string> {
    const balance = await this.provider.getBalance(contractAddress);
    return formatEther(balance);
  }
}

export default new ContractService();
