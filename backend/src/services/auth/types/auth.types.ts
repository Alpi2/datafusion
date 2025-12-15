import { Request } from "express";

export interface AuthenticatedUser {
  id: string; // canonical user id
  userId: string; // duplicate for compatibility
  walletAddress?: string;
  username?: string;
  roles: string[];
  scopes?: string[];
  isAdmin?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export default AuthenticatedRequest;
import { z } from "zod";

export const WalletConnectRequestSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Geçersiz wallet adresi"),
});

export const WalletVerifyRequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().min(1, "İmza gerekli"),
  nonce: z.string().min(1, "Nonce gerekli"),
});

export const ProfileCreateRequestSchema = z.object({
  username: z
    .string()
    .min(3, "Username en az 3 karakter olmalı")
    .max(50, "Username en fazla 50 karakter olabilir")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username sadece harf, rakam, - ve _ içerebilir"
    ),
  email: z.string().email("Geçersiz email").optional(),
  bio: z.string().max(500, "Bio en fazla 500 karakter olabilir").optional(),
});

export type WalletConnectRequest = z.infer<typeof WalletConnectRequestSchema>;
export type WalletVerifyRequest = z.infer<typeof WalletVerifyRequestSchema>;
export type ProfileCreateRequest = z.infer<typeof ProfileCreateRequestSchema>;
