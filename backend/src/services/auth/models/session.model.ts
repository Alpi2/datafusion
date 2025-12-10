export interface SessionModel {
  id: string;
  userId: string;
  createdAt?: Date;
  expiresAt?: Date;
}
