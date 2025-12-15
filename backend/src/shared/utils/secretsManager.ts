import { logger } from "./logger";

// Use require to avoid TypeScript errors in environments where the AWS SDK types
// are not available. The ambient module declaration provides a loose `any` shape.
const awsSecrets: any = require("@aws-sdk/client-secrets-manager");
const SecretsManagerClient: any = awsSecrets.SecretsManagerClient;
const GetSecretValueCommand: any = awsSecrets.GetSecretValueCommand;

const client = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });

export async function getSecret(secretName: string): Promise<string | null> {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const resp = await client.send(command);
    if (resp.SecretString) return resp.SecretString;
    if (resp.SecretBinary) return Buffer.from(resp.SecretBinary).toString();
    return null;
  } catch (e: any) {
    logger.warn("Failed to fetch secret", e?.message || e);
    return null;
  }
}

/**
 * Example usage:
 * const dbCreds = await getSecret(process.env.MY_DB_SECRET_NAME!);
 */
