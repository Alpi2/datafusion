const fs = require("fs");
const path = require("path");

// This script should be executed from the `backend/contracts` folder (Hardhat project root)
// It copies compiled Hardhat artifacts from `artifacts/contracts/*/*.json` into a flat
// `abis/` folder as `<ContractName>.json` so the backend can load ABIs from a simple path.

async function main() {
  const projectRoot = process.cwd();
  const artifactsRoot = path.join(projectRoot, "artifacts", "contracts");
  const outDir = path.join(projectRoot, "abis");

  if (!fs.existsSync(artifactsRoot)) {
    console.error("Artifacts folder not found at", artifactsRoot);
    process.exit(1);
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const contractFiles = fs
    .readdirSync(artifactsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory());
  for (const dir of contractFiles) {
    const dirPath = path.join(artifactsRoot, dir.name);
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      const src = path.join(dirPath, f);
      try {
        const raw = fs.readFileSync(src, "utf8");
        const parsed = JSON.parse(raw);
        const name = parsed.contractName || path.parse(f).name;
        if (!name) continue;
        const outPath = path.join(outDir, `${name}.json`);
        fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2));
        console.log(`Exported ${name} -> ${outPath}`);
      } catch (e) {
        console.warn("Skipping", src, e.message);
      }
    }
  }

  console.log("ABI export complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
