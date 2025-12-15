import { logger } from "../../../shared/utils/logger";

export class IPFSService {
  private pinataApiKey = process.env.PINATA_API_KEY || "";
  private pinataSecret = process.env.PINATA_SECRET || "";
  private pinataJWT = process.env.PINATA_JWT || "";
  private pinJsonUrl = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
  private pinFileUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";

  /**
   * Upload JSON metadata to Pinata. Tries to use axios if available, otherwise falls
   * back to global fetch. Returns an `ipfs://` URI on success.
   */
  async uploadMetadata(metadata: any): Promise<string> {
    try {
      // Try dynamic import of axios to avoid hard dependency at build-time
      let axios: any = null;
      try {
        // @ts-ignore - dynamic import may not have types at build-time
        axios = (await import("axios")).default;
      } catch (_err) {
        axios = null;
      }

      if (axios) {
        const headers: any = { "Content-Type": "application/json" };
        if (this.pinataJWT) headers.Authorization = `Bearer ${this.pinataJWT}`;
        else {
          headers.pinata_api_key = this.pinataApiKey;
          headers.pinata_secret_api_key = this.pinataSecret;
        }
        const res = await axios.post(this.pinJsonUrl, metadata, { headers });
        const ipfsHash = res?.data?.IpfsHash || res?.data?.Hash;
        return ipfsHash ? `ipfs://${ipfsHash}` : "";
      }

      // Fallback to fetch
      const fetchHeaders: any = { "Content-Type": "application/json" };
      if (this.pinataJWT)
        fetchHeaders.Authorization = `Bearer ${this.pinataJWT}`;
      else {
        fetchHeaders.pinata_api_key = this.pinataApiKey;
        fetchHeaders.pinata_secret_api_key = this.pinataSecret;
      }
      const resp = await (globalThis as any).fetch(this.pinJsonUrl, {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify(metadata),
      });
      const json = await resp.json();
      const ipfsHash = json?.IpfsHash || json?.Hash;
      return ipfsHash ? `ipfs://${ipfsHash}` : "";
    } catch (error: any) {
      logger.error(
        "IPFS metadata upload failed",
        error?.response?.data || error?.message || error
      );
      throw new Error("Metadata upload failed");
    }
  }

  /**
   * Upload a file buffer to Pinata. Uses axios+form-data when available; otherwise
   * uses global fetch with FormData (Node 18+).
   */
  async uploadFile(fileBuffer: Buffer, filename: string): Promise<string> {
    try {
      // Try axios + form-data
      try {
        // @ts-ignore
        const axios = (await import("axios")).default;
        // @ts-ignore
        const FormData = (await import("form-data")).default;
        const form = new FormData();
        form.append("file", fileBuffer, { filename });
        const headers: any = form.getHeaders ? form.getHeaders() : {};
        if (this.pinataJWT) headers.Authorization = `Bearer ${this.pinataJWT}`;
        else {
          headers.pinata_api_key = this.pinataApiKey;
          headers.pinata_secret_api_key = this.pinataSecret;
        }
        const res = await axios.post(this.pinFileUrl, form, { headers });
        const hash = res?.data?.IpfsHash || res?.data?.Hash;
        return hash ? `ipfs://${hash}` : "";
      } catch (_e) {
        // Fallback to fetch + global FormData
        const fd = new (globalThis as any).FormData();
        // Buffer -> Blob conversion may not be typed; cast to any for runtime usage
        fd.append("file", new Blob([fileBuffer as any]), filename);
        const headers: any = {};
        if (this.pinataJWT) headers.Authorization = `Bearer ${this.pinataJWT}`;
        else {
          headers.pinata_api_key = this.pinataApiKey;
          headers.pinata_secret_api_key = this.pinataSecret;
        }
        const res = await (globalThis as any).fetch(this.pinFileUrl, {
          method: "POST",
          headers,
          body: fd,
        });
        const json = await res.json();
        const hash = json?.IpfsHash || json?.Hash;
        return hash ? `ipfs://${hash}` : "";
      }
    } catch (error: any) {
      logger.error(
        "IPFS file upload failed",
        error?.response?.data || error?.message || error
      );
      throw new Error("File upload failed");
    }
  }

  getGatewayUrl(ipfsUri: string): string {
    const hash = ipfsUri.replace("ipfs://", "");
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }
}

export default new IPFSService();
