import { parse } from '@babel/parser';
import { Token } from './types';

export default (script: string): Token[] => {
  const f = parse(
    script,
    {
      plugins: ['objectRestSpread'],
      sourceType: 'script',
    },
  );
  return f.program.body;
};
