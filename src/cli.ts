import computeEndpointImpact from './index';

const args = process.argv.slice(2);

const impactedFiles = args.filter(a => a.includes(':'));
const globs = args.filter(a => !a.includes(':'));

if (!impactedFiles.length || !globs.length) {
  console.log(`
    Usage: node ${process.argv[1]} globs file.js:line file.js:line ...

    globs: glob patterns to load all the files in the project, e.g. ./**/*.js

    files: path/to/file.js:line you must specify at least one
  `);
  process.exit(1);
}

const endpoints = computeEndpointImpact(globs, impactedFiles);

if (!endpoints.length) {
  console.error('Strange, no impact found');
} else {
  console.log(endpoints.join('\n'));
}
