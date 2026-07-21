#!/usr/bin/env node
// Validate that the blog is organised according to the following invariants:
//
//   1. Every series listed in `_data/series.yml` has a matching folder under `_posts/`.
//   2. Every folder under `_posts/` corresponds to a series id declared in `_data/series.yml`.
//   3. Every post file is named `YYYY-MM-DD-SERIESID-NN-descriptive-slug.md`
//      where SERIESID matches the containing folder and NN is a two-digit,
//      zero-padded number.
//   4. Each post's frontmatter must have:
//        unique_id: SERIESID-NN
//        series:
//          id: SERIESID
//          index: <integer equal to NN with any leading zero removed>
//   5. `unique_id` values must be unique across all posts.
//   6. Within each series, the set of series indexes must be a contiguous
//      sequence starting at 1 (i.e. 1, 2, 3, …N with no gaps).
//
// Exits with a non-zero status if any check fails.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const seriesFile = join(root, "_data", "series.yml");
const postsRoot = join(root, "_posts");

const errors = [];
const report = (file, message) => errors.push(`${file}: ${message}`);

function readSeriesIds() {
  const source = readFileSync(seriesFile, "utf8");
  const ids = [];
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, "");
    if (!line || line.trimStart().startsWith("#")) continue;
    const match = line.match(/^\s+id:\s*([A-Za-z0-9_-]+)\s*$/);
    if (match) ids.push(match[1]);
  }
  return ids;
}

function parseFrontMatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const body = match[1];
  const lines = body.split(/\r?\n/);
  const data = {};
  let currentKey = null;
  const nested = {};

  for (const line of lines) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    const topLevel = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (topLevel) {
      currentKey = topLevel[1];
      const value = topLevel[2].trim();
      if (value === "") {
        data[currentKey] = {};
        nested[currentKey] = true;
      } else {
        data[currentKey] = value;
        nested[currentKey] = false;
      }
      continue;
    }

    const child = line.match(/^\s+([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (child && currentKey && nested[currentKey]) {
      data[currentKey][child[1]] = child[2].trim();
    }
  }
  return data;
}

function checkPostFile(filePath, seriesId) {
  const fileName = filePath.slice(filePath.lastIndexOf("/") + 1);
  const nameMatch = fileName.match(
    /^(\d{4}-\d{2}-\d{2})-([A-Z][A-Z0-9_-]*?)-(\d{2})-([a-z0-9][a-z0-9-]*)\.(md|markdown)$/,
  );
  if (!nameMatch) {
    report(
      filePath,
      `filename does not match "YYYY-MM-DD-${seriesId}-NN-descriptive-slug.md"`,
    );
    return;
  }

  const [, , fileSeriesId, paddedNumber] = nameMatch;
  if (fileSeriesId !== seriesId) {
    report(
      filePath,
      `filename series segment "${fileSeriesId}" does not match folder "${seriesId}"`,
    );
  }

  const expectedIndex = Number(paddedNumber);
  if (!Number.isInteger(expectedIndex) || expectedIndex < 1) {
    report(filePath, `filename number "${paddedNumber}" is not a positive integer`);
  }

  const source = readFileSync(filePath, "utf8");
  const front = parseFrontMatter(source);
  if (!front) {
    report(filePath, "no YAML frontmatter found");
    return;
  }

  const expectedUniqueId = `${seriesId}-${paddedNumber}`;
  if (front.unique_id !== expectedUniqueId) {
    report(
      filePath,
      `unique_id "${front.unique_id ?? "<missing>"}" should be "${expectedUniqueId}"`,
    );
  }

  const series = front.series;
  if (!series || typeof series !== "object") {
    report(filePath, "frontmatter is missing a `series:` block");
  } else {
    if (series.id !== seriesId) {
      report(
        filePath,
        `series.id "${series.id ?? "<missing>"}" should be "${seriesId}"`,
      );
    }
    if (series.index === undefined) {
      report(filePath, "series.index is missing");
    } else {
      const seriesIndex = Number(series.index);
      if (!Number.isInteger(seriesIndex) || String(seriesIndex) !== String(series.index)) {
        report(
          filePath,
          `series.index "${series.index}" must be an unpadded integer (got a non-integer or padded value)`,
        );
      } else if (seriesIndex !== expectedIndex) {
        report(
          filePath,
          `series.index ${seriesIndex} does not match filename number ${expectedIndex}`,
        );
      }
    }
  }

  return { filePath, uniqueId: front.unique_id, index: expectedIndex };
}

function main() {
  const seriesIds = readSeriesIds();
  if (seriesIds.length === 0) {
    console.error(`No series ids found in ${seriesFile}`);
    process.exit(1);
  }
  const seriesIdSet = new Set(seriesIds);

  const folderEntries = readdirSync(postsRoot, { withFileTypes: true });
  const folderNames = folderEntries.filter((e) => e.isDirectory()).map((e) => e.name);
  const folderSet = new Set(folderNames);

  for (const id of seriesIds) {
    if (!folderSet.has(id)) {
      errors.push(`_posts/${id}/: missing folder for series id declared in _data/series.yml`);
    }
  }

  for (const entry of folderEntries) {
    const entryPath = join(postsRoot, entry.name);
    if (!entry.isDirectory()) {
      errors.push(`${entryPath}: unexpected file at _posts/ top level`);
      continue;
    }
    if (!seriesIdSet.has(entry.name)) {
      errors.push(
        `${entryPath}: folder name "${entry.name}" is not a series id declared in _data/series.yml`,
      );
    }
  }

  const seenUniqueIds = new Map();
  const indexesBySeries = new Map();

  for (const folder of folderNames) {
    if (!seriesIdSet.has(folder)) continue;
    const folderPath = join(postsRoot, folder);
    const files = readdirSync(folderPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = join(folderPath, file.name);
      if (file.isDirectory()) {
        report(filePath, "unexpected directory inside a series folder");
        continue;
      }
      if (!/\.(md|markdown)$/.test(file.name)) {
        report(filePath, "unexpected non-post file inside a series folder");
        continue;
      }
      const result = checkPostFile(filePath, folder);
      if (result?.uniqueId) {
        if (seenUniqueIds.has(result.uniqueId)) {
          report(
            filePath,
            `unique_id "${result.uniqueId}" is already used by ${seenUniqueIds.get(result.uniqueId)}`,
          );
        } else {
          seenUniqueIds.set(result.uniqueId, filePath);
        }
      }
      if (result && Number.isInteger(result.index)) {
        if (!indexesBySeries.has(folder)) indexesBySeries.set(folder, []);
        indexesBySeries.get(folder).push(result.index);
      }
    }
  }

  for (const [seriesId, indexes] of indexesBySeries) {
    const sorted = [...indexes].sort((a, b) => a - b);
    const missing = [];
    const max = sorted[sorted.length - 1];
    const seen = new Set(sorted);
    for (let i = 1; i <= max; i++) {
      if (!seen.has(i)) missing.push(i);
    }
    if (missing.length > 0) {
      const padded = missing.map((n) => String(n).padStart(2, "0")).join(", ");
      errors.push(
        `_posts/${seriesId}/: series indexes have gaps — missing ${padded} (present: ${sorted.map((n) => String(n).padStart(2, "0")).join(", ")})`,
      );
    }
  }

  if (errors.length > 0) {
    console.error(`check-assets: ${errors.length} problem${errors.length === 1 ? "" : "s"} found`);
    for (const message of errors) console.error(`  - ${message}`);
    process.exit(1);
  }

  const postCount = seenUniqueIds.size;
  console.log(
    `check-assets: OK (${seriesIds.length} series, ${postCount} post${postCount === 1 ? "" : "s"} verified)`,
  );
}

main();
