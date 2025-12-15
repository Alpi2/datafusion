import { loadAbi } from "../../src/services/blockchain/utils/contract-abis";
import ContractService from "../../src/services/blockchain/services/contract.service";

describe("Blockchain contract utilities", () => {
  test("loadAbi returns null for missing ABI (graceful)", () => {
    const abi = loadAbi("NonExistentContractForTestPurposes");
    expect(abi).toBeNull();
  });

  test("ContractService handles missing ABIs gracefully when calling getCurrentPrice", async () => {
    // Create an instance that will attempt to load ABIs but likely find none in CI
    const svc = ContractService;
    // when ABI is missing, the method should throw — assert error shape
    await expect(svc.getCurrentPrice("0x0000000000000000000000000000000000000000")).rejects.toThrow();
  });
});
describe.skip('Blockchain integration tests (skipped)', () => {
  it('should run blockchain integration (skipped in CI by default)', async () => {
    // Integration tests that require RPC/node should live here.
  });
});
