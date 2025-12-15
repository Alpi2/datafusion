import path from "path";
import fs from "fs";

/**
 * Load ABI for a given contract name.
 *
 * This will attempt several common Hardhat artifact locations so the backend
 * can find ABIs whether the process is started from the monorepo root or
 * from the `backend` folder. Typical Hardhat artifacts live at:
 *   <hardhat-project>/artifacts/contracts/<ContractFile>.sol/<ContractName>.json
 *
 * Fallbacks are provided for older or custom layouts where a flat
 * `artifacts/<name>.json` is placed under the contracts folder.
 */
export function loadAbi(name: string) {
  const candidates = [
    // If backend cwd is the backend folder and Hardhat project is in backend/contracts
    path.join(
      process.cwd(),
      "contracts",
      "artifacts",
      "contracts",
      `${name}.sol`,
      `${name}.json`
    ),
    path.join(process.cwd(), "contracts", "artifacts", `${name}.json`),
    // If process.cwd() is the repo root and backend lives in ./backend
    path.join(
      process.cwd(),
      "backend",
      "contracts",
      "artifacts",
      "contracts",
      `${name}.sol`,
      `${name}.json`
    ),
    path.join(
      process.cwd(),
      "backend",
      "contracts",
      "artifacts",
      `${name}.json`
    ),
    // Also check for a flattened ABI directory (useful when running an export step in CI)
    path.join(process.cwd(), "contracts", "abis", `${name}.json`),
    path.join(process.cwd(), "backend", "contracts", "abis", `${name}.json`),
  ];

  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const raw = fs.readFileSync(p, "utf8");
      const parsed = JSON.parse(raw);
      // Log where we loaded the ABI from to help debugging in runtime
      // eslint-disable-next-line no-console
      console.info(`[contract-abis] loaded ${name} ABI from ${p}`);
      return parsed.abi || parsed;
    } catch (e) {
      // ignore JSON parse/read errors and try next candidate
      // eslint-disable-next-line no-console
      console.warn(
        `[contract-abis] failed to load ${name} from ${p}: ${
          (e as Error).message
        }`
      );
    }
  }

  // Not found in any of the expected locations
  // eslint-disable-next-line no-console
  console.warn(
    `[contract-abis] ABI for ${name} not found in expected artifact locations`
  );
  return null;
}

export default { loadAbi };
