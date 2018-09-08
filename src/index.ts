import { loadFiles } from './files';
import { getImpactedFile } from './impacted';
import { processFiles } from './process';
import { getAppUsage, isNotNull, uniq } from './util';

export default (
  globs: string[],
  paths: string[],
  appSuffix = '/app.js',
): string[] => {
  const files = loadFiles(globs);

  const impacted = paths.map(getImpactedFile);

  const result = processFiles(files, impacted);

  const app = result.find(f => f.path.endsWith(appSuffix));

  if (!app) return [];

  return uniq([
    ...app.appUsages,
    ...app.usages.map(getAppUsage).filter(isNotNull),
  ].map(u => `${u.method} ${u.path}`.toLowerCase()));
};
