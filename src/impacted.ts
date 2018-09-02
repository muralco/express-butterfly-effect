import { ImpactedFile } from './types';
import { flatten, range } from './util';

const getRange = (rangeSpec: string) => {
  const [start, count] = rangeSpec
    .split('-')
    .map(i => parseInt(i, 10));

  return {
    count: count === undefined ? 1 : count,
    start,
  };
};

export const getImpactedFile = (spec: string): ImpactedFile => {
  const [path, ...ranges] = spec.split(':');

  const lines = flatten(
    ranges.map(getRange).map(r => range(r.start, r.count)),
  );

  return {
    lines,
    path,
  };
};
