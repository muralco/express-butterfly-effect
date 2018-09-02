import { Node } from '@babel/types';
export type Token = Node;

export interface RequireSymbol {
  imported: string;
  local: string;
}

export interface AppUsage {
  method: string;
  path: string | null;
}

export interface Require {
  app?: AppUsage;
  path: string;
  symbols: RequireSymbol[];
}

export interface LoadedFile {
  path: string;
  tokens: Token[];
}

export interface ParsedFile extends LoadedFile {
  exportsApp: boolean;
  requires: Require[];
}

export interface ProcessedFile extends ParsedFile {
  exported: string[];
  usages: string[];
  appUsages: AppUsage[];
}

export interface ImpactedFile {
  path: string;
  lines: number[];
}
