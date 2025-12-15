import { apiClient } from "./client";

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post(`/api/embeddings/upload`, formData as any);
}

export async function searchDocuments(query: string) {
  return apiClient.post(`/api/embeddings/search`, { query });
}

export async function getUserDocuments() {
  return apiClient.get(`/api/embeddings/documents`);
}
