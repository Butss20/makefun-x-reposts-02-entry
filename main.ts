// makefun-x-reposts-02 entry: validates POSTS.json and copies it to the output dir.
// Node 22, standard library only, no network access.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? ".";
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const POST_URL_RE = /^https:\/\/x\.com\/ceokopdesc\/status\/\d+$/;
const MAX_POSTS = 15;

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

const inputPath = join(BOT_DIR, "POSTS.json");
let raw: string;
try {
  raw = readFileSync(inputPath, "utf8");
} catch {
  fail(`cannot read ${inputPath}`);
}

let posts: unknown;
try {
  posts = JSON.parse(raw);
} catch {
  fail(`${inputPath} is not valid JSON`);
}

if (!Array.isArray(posts)) {
  fail("POSTS.json must contain a JSON array of X post URLs");
}
if (posts.length > MAX_POSTS) {
  fail(`POSTS.json lists ${posts.length} posts, more than the ${MAX_POSTS} allowed`);
}
for (const url of posts) {
  if (typeof url !== "string" || !POST_URL_RE.test(url)) {
    fail(
      `invalid post URL: ${JSON.stringify(url)} (expected https://x.com/ceokopdesc/status/<digits>)`,
    );
  }
}
// One X post per pool post: the same entry URL twice would hand in one
// post for two pool posts, which the rules refuse.
const seen = new Set<string>();
for (const url of posts as string[]) {
  if (seen.has(url)) {
    fail(`duplicate post URL: ${url}`);
  }
  seen.add(url);
}

mkdirSync(OUT_DIR, { recursive: true });
const outPath = join(OUT_DIR, "POSTS.json");
const written = JSON.stringify(posts, null, 2) + "\n";
writeFileSync(outPath, written, "utf8");
// Read the output back and confirm it round-trips exactly what was validated.
if (readFileSync(outPath, "utf8") !== written) {
  fail(`output verification failed: ${outPath} does not match the validated list`);
}
console.log(`validated ${posts.length} post(s), wrote ${outPath}`);
for (const url of posts) {
  console.log(`- ${url}`);
}
