// scripts/run-scan.mjs
import { runScan } from "../lib/scanner.js";
const result = await runScan();
console.log(JSON.stringify(result, null, 2));
