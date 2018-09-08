import { resolve } from 'path';
import { DEFAULT } from './consts';
import { parseFile } from './files';
import { findSymbols } from './line-impact';
import { getRequiredSymbols } from './require-impact';
import {
  AppUsage,
  ImpactedFile,
  LoadedFile,
  ParsedFile,
  ProcessedFile,
} from './types';
import { findUsages } from './usages';
import { flatten, getAppUsage, isNotNull, requireMatches, uniq } from './util';

const processFileSymbols = (
  files: ParsedFile[],
  file: ParsedFile,
  fromPath: string,
  fromSymbols: string[],
): ProcessedFile[] => {
  const requires = file.requires.filter(requireMatches(fromPath));

  const symbols = flatten(
    requires.map(r => getRequiredSymbols(r, fromSymbols)),
  );

  const appUsages = requires
    .map(r => r.app ? r.app : null)
    .filter(isNotNull);

  return recurseProcessFile(files, file, symbols, appUsages, false);
};

const mapAppUsages = (
  usages: AppUsage[],
  file: ProcessedFile,
): ProcessedFile => {
  const prefixedUsages = flatten(file.appUsages.map((prefix) => {
    if (prefix.method !== 'use') return [prefix];
    const path = prefix.path
      ? prefix.path
      : '';
    return usages.map(u => ({ ...u, path: `${path}${u.path}` }));
  }));

  return {
    ...file,
    appUsages: prefixedUsages,
  };
};

const recurseProcessFile = (
  files: ParsedFile[],
  file: ParsedFile,
  symbols: string[],
  appUsages: AppUsage[],
  includeSymbolsInUsage: boolean,
): ProcessedFile[] => {
  const newUsages = flatten(symbols.map(s => findUsages(file.tokens, s)));

  // if `file` was directly impacted (i.e. some line was changed in there),
  // the symbols refer to that impacted stuff, and we need to include that in
  // the `usages`.
  const usages = uniq(
    includeSymbolsInUsage
      ? [...symbols, ...newUsages]
      : newUsages,
  );

  const exported = (
    file.exportsApp && usages.some(u => !!getAppUsage(u))
      ? uniq([DEFAULT, ...usages])
      : usages
  ).filter(s => s.startsWith('module.') || s.startsWith('exports.'));

  const processedFile: ProcessedFile = {
    ...file,
    appUsages,
    exported,
    usages,
  };

  if (!exported.length && !(symbols.includes(DEFAULT) && appUsages.length)) {
    return [processedFile];
  }

  const dependent = files
    .filter(f => f.requires.some(requireMatches(file.path)));

  const allAppUsages = [
    ...appUsages,
    ...usages.map(getAppUsage).filter(isNotNull),
  ];

  const depFiles = flatten(
    dependent.map(f => processFileSymbols(files, f, file.path, exported)),
  ).map(f => mapAppUsages(allAppUsages, f));

  return [
    processedFile,
    ...depFiles,
  ];
};

const processFile = (files: ParsedFile[], impacted: ImpactedFile) => {
  const absPath = resolve(impacted.path);

  const file = files.find(f => f.path === absPath);

  if (!file) return [];

  const symbols = flatten(
    impacted.lines.map(line => findSymbols(file.tokens, line)),
  );

  return recurseProcessFile(files, file, symbols, [], true);
};

const groupFiles = (files: ProcessedFile[]) =>
  Object.values(files.reduce(
    (acc, p) => {
      const e = acc[p.path];
      if (!e) {
        acc[p.path] = p;
        return acc;
      }
      acc[p.path] = {
        ...p,
        appUsages: [...e.appUsages, ...p.appUsages],
        exported: uniq([...e.exported, ...p.exported]),
        usages: uniq([...e.usages, ...p.usages]),
      };
      return acc;
    },
    {} as { [path: string]: ProcessedFile },
  ));

export const processFiles = (
  files: LoadedFile[],
  impacted: ImpactedFile[],
): ProcessedFile[] => {
  const parsedFiles = files.map(parseFile);
  const processFiles = flatten(impacted.map(i => processFile(parsedFiles, i)));
  return groupFiles(processFiles);
};
