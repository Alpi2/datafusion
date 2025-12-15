import { ElasticsearchService } from "../src/services/marketplace/search/elasticsearch.service";

async function run() {
  const svc = new ElasticsearchService();
  try {
    console.log("Initializing ES...");
    await svc.initialize();
    console.log("Done");
  } catch (e) {
    console.error("Init failed:", e);
    process.exit(1);
  }
}
run();
