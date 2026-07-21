import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const postsRoot = join(root, "_posts");

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
    process.env.PROGRAMFILES && join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe"),
  ].filter(Boolean);

  const chrome = candidates.find(existsSync);
  if (!chrome) {
    throw new Error("Chrome or Edge was not found. Install one or set CHROME_PATH.");
  }

  return chrome;
}

function walkMarkdown(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walkMarkdown(path);
    return [".md", ".markdown"].includes(extname(entry.name)) ? [path] : [];
  });
}

function frontMatterValue(source, key) {
  const frontMatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontMatter) return undefined;
  return frontMatter[1].match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim();
}

function render(chrome, coverPath, imagePath) {
  const result = spawnSync(chrome, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1200,630",
    `--screenshot=${imagePath}`,
    pathToFileURL(coverPath).href,
  ], { encoding: "utf8" });

  if (result.status !== 0) {
    throw new Error(result.stderr || `Chrome exited with status ${result.status}`);
  }
}

const requestedPosts = process.argv.slice(2).map((path) => resolve(root, path));
const posts = requestedPosts.length > 0 ? requestedPosts : walkMarkdown(postsRoot);
const chrome = findChrome();
let rendered = 0;

for (const post of posts) {
  const source = readFileSync(post, "utf8");
  const cover = frontMatterValue(source, "cover");
  const image = frontMatterValue(source, "image");

  if (!cover && !image) continue;
  if (!cover || !image) throw new Error(`${post} must define both cover and image.`);
  if (!cover.endsWith(".svg") || !image.endsWith(".png")) {
    throw new Error(`${post} must use an SVG cover and PNG image.`);
  }

  const coverPath = resolve(root, cover.replace(/^\//, ""));
  const imagePath = resolve(root, image.replace(/^\//, ""));
  if (!existsSync(coverPath)) throw new Error(`Cover not found: ${coverPath}`);

  render(chrome, coverPath, imagePath);
  console.log(`${cover} -> ${image}`);
  rendered += 1;
}

console.log(`Rendered ${rendered} social image${rendered === 1 ? "" : "s"}.`);