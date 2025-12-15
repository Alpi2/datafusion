import { apiClient } from "./client";

export async function chatWithDataset(
  datasetId: string,
  message: string,
  conversationHistory: any[]
) {
  return apiClient.post(`/api/chat/dataset/${datasetId}`, { message, conversationHistory });
}

export async function detectPatterns(datasetId: string) {
  return apiClient.get(`/api/chat/dataset/${datasetId}/patterns`);
}

export async function detectAnomalies(datasetId: string) {
  return apiClient.get(`/api/chat/dataset/${datasetId}/anomalies`);
}
