export interface BondingDeployPayload {
  datasetId: string;
  name: string;
  symbol: string;
  metadataUri: string;
}

export interface BlockchainJobResult {
  success: boolean;
  txHash?: string;
  contractAddress?: string;
}
