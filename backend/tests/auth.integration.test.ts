import request from "supertest";
import app from "../src/app";
import { RedisUtil } from "../src/services/auth/utils/redis.util";
import { Web3Util } from "../src/services/auth/utils/web3.util";

describe("Auth integration", () => {
  const testAddress = "0x000000000000000000000000000000000000dead";

  it("should create a nonce and verify wallet signature returning a token", async () => {
    // Call connect to receive a nonce
    const connectRes = await request(app)
      .post("/api/auth/wallet/connect")
      .send({ walletAddress: testAddress })
      .expect(200);

    const nonce = connectRes.body?.data?.nonce;
    expect(typeof nonce).toBe("string");

    // Mock Redis getNonceAndDelete to return the nonce when verify runs
    jest
      .spyOn(RedisUtil.prototype, "getNonceAndDelete")
      .mockResolvedValue(nonce);

    // Mock Web3Util.verifySignature to succeed
    jest
      .spyOn(Web3Util.prototype, "verifySignature")
      .mockResolvedValue(true as any);

    const verifyRes = await request(app)
      .post("/api/auth/wallet/verify")
      .send({ walletAddress: testAddress, signature: "0xdead", nonce })
      .expect(200);

    expect(verifyRes.body).toHaveProperty("data.token");
    expect(verifyRes.body.data.user).toHaveProperty("id");
  });
});
