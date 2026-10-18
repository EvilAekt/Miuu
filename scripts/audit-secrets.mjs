#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

console.log("==========================================");
console.log("    Audit Kepatuhan & Rahasia (PRD v5 E2) ");
console.log("==========================================");

const suspiciousPatterns = [
  /discord[a-zA-Z0-9_\-\.]{50,}/i,
  /ghp_[a-zA-Z0-9]{36}/,
  /BEGIN (RSA|OPENSSH|PRIVATE) KEY/,
  /password\s*=\s*['"][a-zA-Z0-9_\-]{8,}['"]/i,
];

const ignoredDirs = new Set(["node_modules", ".git", "jre", "data", "backups", "logs", "staging", "music", "out"]);
let violations = 0;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile()) {
      if (entry.name === ".env" || entry.name.endsWith(".jar") || entry.name.endsWith(".db")) continue;

      try {
        const content = fs.readFileSync(fullPath, "utf8");
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(content)) {
            console.warn(`⚠️ Potensi rahasia terdeteksi di: ${path.relative(process.cwd(), fullPath)}`);
            violations++;
            break;
          }
        }
      } catch {}
    }
  }
}

scanDir(process.cwd());

if (violations === 0) {
  console.log("✅ Audit Rahasia Lolos: Tidak ada rahasia atau token yang terekspos di kode.");
} else {
  console.error(`❌ Ditemukan ${violations} potensi kebocoran rahasia!`);
  process.exit(1);
}
