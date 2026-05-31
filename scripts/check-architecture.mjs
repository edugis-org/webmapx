#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();

const runtimeRoots = [
  'src/map',
];

const runtimeSingletonFiles = [
  'src/components/webmapx-map.ts',
];

// Transitional exception documented in docs/developer/architecture-contract.md.
const allowedTreeSemanticsFiles = new Set([
  'src/components/webmapx-map.ts',
]);

const forbiddenTreeSemantics = [
  /\bselectionMode\b/g,
  /\bselectionGroup\b/g,
  /\ballowNone\b/g,
  /\bstackOrder\b/g,
  /\bcatalogConfig\s*\?\.\s*tree\b/g,
  /\bcatalogConfig\s*\.\s*tree\b/g,
  /\bcatalog\s*\.\s*tree\b/g,
  /\bTreeNodeConfig\b/g,
];

const forbiddenRuntimeImports = [
  /from\s+['"][^'"]*webmapx-layer-tree[^'"]*['"]/g,
  /from\s+['"][^'"]*layer-panel-model[^'"]*['"]/g,
];

const allowedRuntimeImportBoundaryFiles = new Set([
]);

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

async function walkFiles(rootDir) {
  const absoluteRoot = path.join(workspaceRoot, rootDir);
  const entries = await readdir(absoluteRoot, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(absoluteRoot, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(path.join(rootDir, entry.name)));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.ts')) {
      files.push(toPosixPath(path.relative(workspaceRoot, fullPath)));
    }
  }

  return files;
}

function collectLineNumbers(content, regex) {
  regex.lastIndex = 0;
  const lineNumbers = new Set();
  let match;
  while ((match = regex.exec(content)) !== null) {
    const index = match.index;
    const line = content.slice(0, index).split('\n').length;
    lineNumbers.add(line);
  }
  return [...lineNumbers].sort((a, b) => a - b);
}

async function main() {
  const runtimeFiles = new Set();

  for (const root of runtimeRoots) {
    const files = await walkFiles(root);
    for (const file of files) {
      runtimeFiles.add(file);
    }
  }

  for (const singleFile of runtimeSingletonFiles) {
    runtimeFiles.add(singleFile);
  }

  const treeSemanticsViolations = [];
  const importBoundaryViolations = [];

  for (const file of runtimeFiles) {
    const absolutePath = path.join(workspaceRoot, file);
    const content = await readFile(absolutePath, 'utf8');

    if (!allowedTreeSemanticsFiles.has(file)) {
      for (const pattern of forbiddenTreeSemantics) {
        const lines = collectLineNumbers(content, pattern);
        if (lines.length === 0) {
          continue;
        }

        treeSemanticsViolations.push({
          file,
          pattern: pattern.toString(),
          lines,
        });
      }
    }

    if (!allowedRuntimeImportBoundaryFiles.has(file)) {
      for (const pattern of forbiddenRuntimeImports) {
        const lines = collectLineNumbers(content, pattern);
        if (lines.length === 0) {
          continue;
        }

        importBoundaryViolations.push({
          file,
          pattern: pattern.toString(),
          lines,
        });
      }
    }
  }

  if (treeSemanticsViolations.length === 0 && importBoundaryViolations.length === 0) {
    console.log('Architecture guardrail passed: no forbidden tree semantics or runtime import-boundary violations found.');
    return;
  }

  if (treeSemanticsViolations.length > 0) {
    console.error('Architecture guardrail failed. Forbidden tree semantics were found in runtime modules:');
    for (const violation of treeSemanticsViolations) {
      console.error(`- ${violation.file}: ${violation.pattern} at lines ${violation.lines.join(', ')}`);
    }
  }

  if (importBoundaryViolations.length > 0) {
    console.error('Architecture guardrail failed. Runtime import-boundary violations were found:');
    for (const violation of importBoundaryViolations) {
      console.error(`- ${violation.file}: ${violation.pattern} at lines ${violation.lines.join(', ')}`);
    }
  }

  console.error('\nIf this is intentional temporary debt, add it as a documented exception in docs/developer/architecture-contract.md and in this checker allowlist.');
  process.exit(1);
}

main().catch((error) => {
  console.error('Architecture guardrail failed to run:', error);
  process.exit(1);
});
