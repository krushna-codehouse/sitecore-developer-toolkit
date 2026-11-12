import fs from 'node:fs';
import path from 'node:path';

/** Project root. Overridable with TOOLKIT_ROOT so tests (or other repos) can point the toolkit elsewhere. */
export function projectRoot(): string {
  return process.env.TOOLKIT_ROOT ?? process.cwd();
}

export function fromRoot(...segments: string[]): string {
  return path.join(projectRoot(), ...segments);
}

/** Root-relative path with forward slashes, for readable output on every OS. */
export function relativeToRoot(absolutePath: string): string {
  return path.relative(projectRoot(), absolutePath).split(path.sep).join('/');
}

export function readFileIfExists(absolutePath: string): string | undefined {
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : undefined;
}

/** Recursively list files under a directory, skipping node_modules and generated folders. */
export function walkFiles(dir: string, predicate: (file: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'generated') continue;
      out.push(...walkFiles(full, predicate));
    } else if (predicate(full)) {
      out.push(full);
    }
  }
  return out.sort();
}
