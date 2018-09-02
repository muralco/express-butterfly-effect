import { deepEqual, fail } from 'assert';
import { Before, Given, Then, When } from 'cucumber';
import { resolve } from 'path';
import { ANONYMOUS, APP } from './consts';
import getTokens from './get-tokens';
import { getImpactedFile } from './impacted';
import { findSymbols } from './line-impact';
import { processFiles } from './process';
import { getRequiredSymbols } from './require-impact';
import { findRequires } from './requires';
import { LoadedFile, ProcessedFile, Require } from './types';
import { findUsages, getAppUsage, setAppUsage } from './usages';

const splitList = (s: string) => {
  if (s === 'empty') return [];
  return s
    .replace(' and ', ',')
    .split(',')
    .map(s => s.trim());
};

const unquote = (s: string) => s
  .replace(/^['"]/, '')
  .replace(/['"]$/, '');

const getLines = (s: string) =>
  splitList(s).map(l => parseInt(l, 10));

// === Context ============================================================== //
let ctx: { [key: string]: any } = {};

Before(() => { ctx = { files: [] }; });

// === Given ================================================================ //
Given(/a file(?: "([^"]+)")? with/, (path: string, content: string) => {
  const tokens = getTokens(content);
  ctx['tokens'] = tokens;
  if (path) {
    const f: LoadedFile = { path, tokens };
    ctx['files'].push(f);
  }
});
Given('a require with', (json: string) => ctx['require'] = JSON.parse(json));

// === When ================================================================= //
When(/finding the symbols at line (\d+)/, (line: number) =>
  ctx['symbols'] = findSymbols(ctx['tokens'], line),
);

When(/finding the usages of "(.*)"/, (id: string) =>
  ctx['symbols'] = findUsages(ctx['tokens'], id),
);

When(/finding requires/, () => {
  const requires = findRequires(ctx['tokens']);
  ctx['symbols'] = requires.map(r => r.path),
  ctx['requires'] = requires;
});

When(/finding local symbols for (.*)/, (list: string) =>
  ctx['symbols'] = getRequiredSymbols(
    ctx['require'],
    splitList(list).map(unquote),
  ),
);

When(/loading an impact spec "(.*)"/, (spec: string) =>
  ctx['impact'] = getImpactedFile(spec),
);

When(
  /processing the impact for "(.*)" at lines? (.*)/,
  (path: string, lines: string) =>
    ctx['process'] = processFiles(
      ctx['files'],
      [{ path, lines: getLines(lines) }],
    ),
);

// === Then ================================================================= //
const CONSTS: { [k: string]: string } = {
  anonymous: ANONYMOUS,
  app: APP,
};
const expandConsts = (s: string) => CONSTS[s] || s;

Then(/the (?:symbols?|requires?) (?:are|is) (.*)/, (symbols: string) => {
  deepEqual(
    ctx['symbols'].sort(),
    splitList(symbols).map(unquote).map(expandConsts).sort(),
  );
});

const getRequire = (path: string) => {
  const requires = ctx['requires'] as Require[];
  const actual = requires.find(r => r.path === path);
  if (!actual) {
    return fail(`No require for "${path}" found.
    Requires found:
    --------------${requires.map(r => `\n    - ${r.path}`).join('')}
  `);
  }
  return actual;
};

Then(/the require for "([^"]+)" imports (.*)/, (
  path: string,
  specList: string,
) => {
  const actual = getRequire(path);

  const sortSymbols = (s: Require['symbols']) =>
    s.sort((a, b) => a.imported <= b.imported ? -1 : 1);

  const expected: Require['symbols'] = splitList(specList)
    .map(i => i.split(' as ').map(unquote))
    .map(([imported, local]) => ({
      imported,
      local: expandConsts(local) || imported,
    }));

  deepEqual(
    sortSymbols(actual.symbols),
    sortSymbols(expected),
  );
});

Then(/the require for "([^"]+)" maps to app.(\w+)\((?:['"]([^'"]+)['"])?\)/, (
  path: string,
  appMethod: string,
  appPath,
) => {
  const actual = getRequire(path);
  deepEqual(
    actual.app,
    { method: appMethod, path: appPath },
  );
});

Then(/the symbol maps to app.(\w+)\((?:['"]([^'"]+)['"])?\)/, (
  appMethod: string,
  appPath,
) => {
  const symbols = ctx['symbols'];
  deepEqual(symbols.length, 1);

  const actual = getAppUsage(symbols[0]);
  deepEqual(
    actual,
    { method: appMethod, path: appPath },
  );
});

Then(/the impact path is "([^"]+)" and the lines? (?:are|is) (.+)/, (
  path: string,
  lines: string,
) => {
  const actual = ctx['impact'];
  deepEqual(actual.path, path);
  deepEqual(actual.lines, getLines(lines));
});

const mapUsages = (s: string) => {
  const [method, path] = (/app.(\w+)\((?:['"]([^'"]+)['"])?\)/.exec(s) || [])
    .slice(1);
  if (!method) return s;
  return setAppUsage(method, path);
};

Then(/the impact for "([^"]+)" has( no)? usages?(.*) and( no)? exports?(.*)/, (
  path: string,
  noUsages: string,
  usages: string,
  noExports: string,
  exported: string,
) => {
  const processed = ctx['process'] as ProcessedFile[];
  const absPath = resolve(path);
  const actual = processed.find(p => p.path === absPath) as ProcessedFile;
  deepEqual(!!actual, true, `Cannot find a file with "${absPath}"
    Files found:
    -----------${processed.map(p => `\n    - ${p.path}`).join('')}
  `);
  deepEqual(
    actual.exported.sort(),
    noExports ? [] : splitList(exported).map(unquote).sort(),
  );
  deepEqual(
    actual.usages.sort(),
    noUsages ? [] : splitList(usages).map(unquote).map(mapUsages).sort(),
  );
});

Then(/the file "([^"]+)" was not impacted/, (path: string) => {
  const processed = ctx['process'] as ProcessedFile[];
  const absPath = resolve(path);
  const actual = processed.find(p => p.path === absPath);
  deepEqual(!actual, true, `File "${absPath}" was impacted!
    Impact:
    ------
    ${JSON.stringify({ ...actual, requires: undefined, tokens: undefined })}
  `);
});

Then(/the impacted endpoints? (?:are|is) (.*)/, (
  endpoints: string,
) => {
  const processed = ctx['process'] as ProcessedFile[];
  const absPath = resolve('./app.js');
  const app = processed.find(p => p.path === absPath) as ProcessedFile;
  deepEqual(!!app, true, `Cannot find a file with "${absPath}"
    Files found:
    -----------${processed.map(p => `\n    - ${p.path}`).join('')}
  `);
  deepEqual(
    app.appUsages.map(u => `${u.method} ${u.path}`.toLowerCase()).sort(),
    splitList(endpoints).map(unquote).map(e => e.toLowerCase()).sort(),
  );
});
