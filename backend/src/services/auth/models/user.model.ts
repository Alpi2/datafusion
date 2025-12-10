export interface UserModel {
  id: string;
  email?: string | null;
  walletAddress?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
