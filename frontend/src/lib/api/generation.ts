import { apiClient } from "./client";

export type CreateGenerationRequest = {
  prompt: string;
  tier?: string;
  schema?: any;
  aiModels?: string[];
  validationLevel?: string;
  knowledgeDocumentIds?: string[];
  chatContext?: any;
};

export type CreateGenerationResponse = { jobId: string };

export type GenerationStatus = {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  currentStep?: string;
  resultUrl?: string;
  datasetId?: string;
  errorMessage?: string;
};

export const generationAPI = {
  create(data: CreateGenerationRequest) {
    return apiClient.post<CreateGenerationResponse>(
      "/api/generation/create",
      data
    );
  },
  getStatus(jobId: string) {
    return apiClient.get<GenerationStatus>(`/api/generation/status/${jobId}`);
  },
  getHistory(page = 1, limit = 20) {
    return apiClient.get<any>(
      `/api/generation/history?page=${page}&limit=${limit}`
    );
  },
  cancelJob(jobId: string) {
    return apiClient.post<{ success: boolean }>(
      `/api/generation/cancel/${jobId}`
    );
  },
  validate(body: any) {
    return apiClient.post<any>(`/api/generation/validate`, body);
  },
  preview(body: any) {
    return apiClient.post<any>(`/api/generation/preview`, body);
  },
  getSchemas() {
    return apiClient.get<any[]>(`/api/generation/schema`);
  },
  getTemplates() {
    return apiClient.get<any[]>(`/api/generation/templates`);
  },
  saveSchema(body: any) {
    return apiClient.post<any>(`/api/generation/schema`, body);
  },
  updateSchema(id: string, body: any) {
    return apiClient.put<any>(`/api/generation/schema/${id}`, body);
  },
  deleteSchema(id: string) {
    // some clients name the method `del` instead of `delete`
    // attempt both to be compatible with different clients
    if ((apiClient as any).del)
      return (apiClient as any).del(`/api/generation/schema/${id}`);
    return (apiClient as any).delete(`/api/generation/schema/${id}`);
  },
};

export default generationAPI;
