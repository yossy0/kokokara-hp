// Pages には除外設定ファイルがないため、公開するファイルを _site に集める。
// 動画は HP のページから参照されておらず、assets/clarkv3.mp4 と
// assets/mbti/_new/CLRKv3.mp4、assets/mbti/_new/CLRKv3_web.mp4 は 25 MiB を超える。
// vercel.json は Vercel 用のため除外する。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, '_site');
const excludedDirectories = new Set([
  '_site', 'node_modules', 'tools', '_t2', 'assets/mbti/_raw', 'assets/mbti/_new',
]);
const excludedFiles = new Set([
  'pages_build.mjs', 'vercel.json', 'wrangler.jsonc', 'wrangler.toml',
  'HP修正.txt', 'Thumbs.db', 'assets/mbti/_sheet.png', 'assets/mbti/_check.png',
]);
const excludedExtensions = new Set(['.md', '.ps1', '.bat', '.log', '.mp4', '.webm', '.mov']);
const files = [];

function copyFiles(relativeDirectory) {
  const sourceDirectory = path.join(root, relativeDirectory);
  for (const entry of fs.readdirSync(sourceDirectory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;

    const relativePath = path.posix.join(relativeDirectory, entry.name);
    if (entry.isDirectory() && !excludedDirectories.has(relativePath)) {
      copyFiles(relativePath);
    }
    if (!entry.isFile() || excludedFiles.has(relativePath) ||
        excludedExtensions.has(path.extname(entry.name).toLowerCase())) continue;

    const destination = path.join(output, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(sourceDirectory, entry.name), destination);
    files.push({ relativePath, size: fs.statSync(destination).size });
  }
}

if (fs.existsSync(output)) fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
copyFiles('');

const errors = files
  .filter(({ size }) => size >= 25 * 1024 * 1024)
  .map(({ relativePath }) => `_site/${relativePath}: 25 MiB 以上`);
if (files.length >= 20_000) {
  errors.push(`_site: ファイル数が 20,000 以上 (${files.length})`);
}
for (const required of ['index.html', '404.html']) {
  if (!fs.existsSync(path.join(output, required))) errors.push(`_site/${required}: 見つかりません`);
}
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exit(1);
}

const totalBytes = files.reduce((sum, { size }) => sum + size, 0);
console.log(`pages_build: ${files.length} files, ${totalBytes} bytes -> _site`);
