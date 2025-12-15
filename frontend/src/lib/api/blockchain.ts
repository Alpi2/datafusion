import { apiClient } from "./client";

export interface BondingCurveDeployment {
  datasetId: string;
  tokenName: string;
  tokenSymbol: string;
}

export interface BondingCurveInfo {
  id: string;
  contractAddress: string;
  nftTokenId: string;
  transactionHash: string;
  // backward-compatible snake_case fields (some parts of the UI expect these)
  contract_address?: string;
  nft_token_id?: string;
}

export interface DeployResponse {
  success: boolean;
  bondingCurve: BondingCurveInfo;
  // some controllers historically returned top-level camelCase address
  contractAddress?: string;
}

export interface TradeResponse {
  success: boolean;
  transactionHash: string;
}

export interface PriceInfo {
  currentPrice: string;
  marketCap: string;
  supply: string;
  graduated: boolean;
}

export interface StatusInfo {
  contractAddress: string;
  currentSupply: string;
  currentPrice: string;
  marketCap: string;
  totalVolume: string;
  holderCount: number;
  graduated: boolean;
  uniswapPool?: string | null;
  recentTrades?: Array<any>;
}

export const blockchainAPI = {
  async deployBondingCurve(data: BondingCurveDeployment) {
    return apiClient.post<DeployResponse>("/api/bonding/deploy", data);
  },
  async buyTokens(datasetId: string, amount: string) {
    return apiClient.post<TradeResponse>(`/api/bonding/buy/${datasetId}`, {
      amount,
    });
  },
  async sellTokens(datasetId: string, amount: string) {
    return apiClient.post<TradeResponse>(`/api/bonding/sell/${datasetId}`, {
      amount,
    });
  },
  async getPrice(datasetId: string) {
    return apiClient.get<PriceInfo>(`/api/bonding/price/${datasetId}`);
  },
  async getStatus(datasetId: string) {
    return apiClient.get<StatusInfo>(`/api/bonding/status/${datasetId}`);
  },
};
