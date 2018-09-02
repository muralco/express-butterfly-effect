import { Require, RequireSymbol } from './types';
import { flatten, isNotNull } from './util';

const normalizeImport = (imported: string) =>
  imported.startsWith('module.exports')
    ? imported
    : `module.exports.${imported}`;

const getLocalSymbols = (
  symbol: RequireSymbol,
  exported: string[],
): string[] => {
  const imported = normalizeImport(symbol.imported);

  return exported
    .filter(e => e.startsWith(imported))
    .map(e => e.replace(imported, symbol.local));
};

export const getRequiredSymbols = (
  require: Require,
  identifiers: string[],
): string[] => {
  const exported = identifiers
    .map(i => i.replace(/^exports\./, 'module.exports.'))
    .filter(i => i.startsWith('module.exports'));
  return flatten(
    require
      .symbols
      .map(s => getLocalSymbols(s, exported).filter(isNotNull)),
  );
};
