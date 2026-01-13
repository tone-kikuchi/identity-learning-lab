import assert from 'node:assert/strict';
import { test } from 'node:test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd());

async function collectHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          return [];
        }
        return collectHtmlFiles(entryPath);
      }
      if (entry.isFile() && entry.name.endsWith('.html')) {
        return [entryPath];
      }
      return [];
    })
  );
  return files.flat();
}

test('HTML does not use root-absolute /shared or /sp paths', async () => {
  const htmlFiles = await collectHtmlFiles(repoRoot);
  const offenders = [];

  await Promise.all(
    htmlFiles.map(async (file) => {
      const content = await fs.readFile(file, 'utf8');
      const matches = content.matchAll(/(?:href|src)=["']\/(?:shared|sp)(?:\/|["'])/g);
      for (const match of matches) {
        offenders.push(`${path.relative(repoRoot, file)}: ${match[0]}`);
      }
    })
  );

  assert.deepEqual(offenders, []);
});
