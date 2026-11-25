// bounty-entrants-03 entry (Node 22, standard library only).
// The entry is the bounties themselves: BOUNTY.json names the three bounties
// this account sponsors on make.fun. The program hands that list to the
// grader untouched: it reads BOUNTY.json from the repository, checks its
// shape against the gate's limits, and writes the exact same bytes to
// /output/BOUNTY.json. Nothing about the bounties is scored from what this
// program writes — the house reads the bounties in its own database.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const raw = readFileSync(join(BOT_DIR, 'BOUNTY.json'));

const MAX_FILE_BYTES = 16384;
const MAX_ITEM_CHARS = 2048;

if (raw.length > MAX_FILE_BYTES) {
  console.error(`BOUNTY.json is ${raw.length} bytes, over the gate's ${MAX_FILE_BYTES} cap.`);
  process.exit(1);
}

let parsed: unknown;
try {
  parsed = JSON.parse(raw.toString('utf8'));
} catch (err) {
  console.error(`BOUNTY.json is not valid JSON: ${(err as Error).message}`);
  process.exit(1);
}

if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
  console.error('BOUNTY.json must be a JSON object naming bounties or url.');
  process.exit(1);
}

const hasBounties = 'bounties' in parsed;
const hasUrl = 'url' in parsed;
if (hasBounties === hasUrl) {
  console.error('BOUNTY.json must name bounties or url, not both and not neither.');
  process.exit(1);
}

if (hasBounties) {
  const list = (parsed as { bounties: unknown }).bounties;
  if (!Array.isArray(list) || list.length < 1 || list.length > 100) {
    console.error('BOUNTY.json must name between 1 and 100 bounties.');
    process.exit(1);
  }
  for (const item of list) {
    if (typeof item !== 'string' || item.length < 1 || item.length > MAX_ITEM_CHARS) {
      console.error('Every bounty in BOUNTY.json must be a non-empty string of at most 2048 characters.');
      process.exit(1);
    }
    if (item.includes('://') && !item.includes('make.fun')) {
      console.error(`Bounty address ${item} is not on make.fun.`);
      process.exit(1);
    }
  }
} else {
  const url = (parsed as { url: unknown }).url;
  if (typeof url !== 'string' || url.length < 1 || url.length > MAX_ITEM_CHARS || !url.includes('make.fun')) {
    console.error('BOUNTY.json url must be a make.fun bounty address of at most 2048 characters.');
    process.exit(1);
  }
}

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(join(OUTPUT_DIR, 'BOUNTY.json'), raw);
