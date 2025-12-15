import apiClient from "./client";

export async function requestWalletNonce(walletAddress: string) {
  return apiClient.post<{ message: string; nonce: string; user?: any }>(
    "/api/auth/wallet/connect",
    { walletAddress }
  );
}

export async function verifyWalletSignature(payload: {
  walletAddress: string;
  signature: string;
  nonce: string;
}) {
  return apiClient.post<{ token: string; user: any }>(
    "/api/auth/wallet/verify",
    payload
  );
}

export async function createProfile(username: string) {
  return apiClient.post<{ success?: boolean; user?: any; error?: any }>(
    "/api/auth/profile/create",
    { username }
  );
}

const authAPI = {
  requestWalletNonce,
  verifyWalletSignature,
  createProfile,
};

export default authAPI;
