import { logger } from "../../../shared/utils/logger";
import { JsonRpcProvider, Wallet, type TransactionRequest } from "ethers";

export class TransactionService {
  provider: JsonRpcProvider;
  signer: Wallet | null = null;

  constructor() {
    this.provider = new JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC);
    if (process.env.DEPLOYER_PRIVATE_KEY) {
      this.signer = new Wallet(process.env.DEPLOYER_PRIVATE_KEY, this.provider);
    }
  }

  async sendTransaction(tx: TransactionRequest) {
    if (!this.signer) throw new Error("No signer configured");
    const sent = await this.signer.sendTransaction(tx);
    logger.info("Sent tx", sent.hash);
    const receipt = await sent.wait(1);
    logger.info(
      "Tx mined",
      (receipt as any)?.transactionHash ||
        (receipt as any)?.transactionHash ||
        receipt
    );
    return receipt;
  }
}

export default new TransactionService();
