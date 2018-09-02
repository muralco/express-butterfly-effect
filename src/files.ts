import { readFileSync } from 'fs';
import glob from 'glob';
import { dirname, resolve } from 'path';
import getTokens from './get-tokens';
import { findRequires } from './requires';
import { LoadedFile, ParsedFile } from './types';
import { defaultExportIsApp, flatten } from './util';

const loadFile = (path: string): LoadedFile => {
  try {
    const tokens = getTokens(readFileSync(path, { encoding: 'utf8' }));
    return {
      path,
      tokens,
    };
  } catch (e) {
    console.log(`${path}:${e.loc && e.loc.line}`);
    throw e;
  }
};

export const loadFiles = (patterns: string[]): LoadedFile[] =>
  flatten(patterns.map(p => glob.sync(p)))
    .map(loadFile);

export const parseFile = (file: LoadedFile): ParsedFile => {
  const path = resolve(file.path);
  const dir = dirname(path);
  return {
    ...file,
    exportsApp: defaultExportIsApp(file.tokens),
    path,
    requires: findRequires(file.tokens)
      .map(r => ({ ...r, path: resolve(dir, r.path) })),
  };
};
