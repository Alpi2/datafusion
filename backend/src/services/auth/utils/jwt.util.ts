import jwt, { type Secret } from "jsonwebtoken";

export interface JWTPayload {
  userId: string;
  walletAddress: string;
  username: string;
  roles?: string[]; // e.g. ['user','admin']
  scopes?: string[]; // fine-grained permissions
  jti?: string; // token id for rotation/revocation tracking
}

export class JWTUtil {
  private secret: string;
  private expiresIn: string;
  constructor() {
    this.secret = process.env.JWT_SECRET!;
    this.expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  }
  /**
   * JWT token oluştur
   */
  generateToken(payload: JWTPayload): string {
    // Use a loose call to jwt.sign to avoid strict overload conflicts across jwt versions/types
    const claims = { ...payload } as any;
    if (!claims.jti) claims.jti = `${payload.userId}:${Date.now()}`;
    return (jwt as unknown as any).sign(claims, this.secret, {
      expiresIn: this.expiresIn,
      issuer: "datafusion-api",
    });
  }
  /**
   * JWT token'ı doğrula ve decode et
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.secret) as JWTPayload;
    } catch (error) {
      return null;
    }
  }
  /**
   * Token'dan expiry date'i al
   */
  getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      return decoded?.exp ? new Date(decoded.exp * 1000) : null;
    } catch {
      return null;
    }
  }
}
