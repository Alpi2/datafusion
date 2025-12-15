import { ethers } from "ethers";

export class Web3Util {
  private provider: ethers.JsonRpcProvider;
  private inflTokenContract?: ethers.Contract;
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

    // ERC-20 ABI (balanceOf için)
    const erc20Abi = ["function balanceOf(address) view returns (uint256)"];
    // Only initialize the contract if the address is provided via env
    if (process.env.INFL_TOKEN_CONTRACT) {
      this.inflTokenContract = new ethers.Contract(
        process.env.INFL_TOKEN_CONTRACT,
        erc20Abi,
        this.provider
      );
    }
  }
  /**
   * Wallet imzasını doğrula
   */
  async verifySignature(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      return false;
    }
  }
  /**
   * $INFL token bakiyesini getir
   */
  async getInflBalance(walletAddress: string): Promise<string> {
    try {
      if (!this.inflTokenContract) {
        // If no contract configured, return zero balance as a safe default for tests/environments
        return "0";
      }
      const balance = await this.inflTokenContract.balanceOf(walletAddress);
      // Wei'den token'a çevir (18 decimal)
      return ethers.formatUnits(balance, 18);
    } catch (error) {
      throw new Error("Token bakiyesi alınamadı");
    }
  }
  /**
   * Wallet adresini validate et
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }
  /**
   * Nonce mesajı oluştur (replay attack önleme)
   */
  generateNonceMessage(walletAddress: string, nonce: string): string {
    return `DataFusion Authentication\n\nWallet: ${walletAddress}\nNonce: ${nonce}\n\nSign this message to prove you own this wallet.`;
  }
}
