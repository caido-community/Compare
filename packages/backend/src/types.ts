import type { SDK } from "caido:plugin";

export interface CompareItem {
  id: number;
  length: number;
  data: string;
  preview: string;
  timestamp: Date;
  type: "request" | "response" | "file" | "clipboard";
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface ComparisonRequest {
  item1: CompareItem;
  item2: CompareItem;
  type: "words" | "bytes" | "characters";
  options?: {
    ignoreWhitespace?: boolean;
    ignoreCase?: boolean;
  };
}

export interface ComparisonResult {
  type: "words" | "bytes" | "characters";
  differences: ComparisonDifference[];
  summary: {
    added: number;
    deleted: number;
    modified: number;
    total: number;
  };
}

export interface ComparisonDifference {
  type: "added" | "deleted" | "modified";
  position: number;
  length: number;
  content: string;
  lineNumber?: number;
}

export type ComparisonDiff = {
  type: "added" | "deleted" | "modified" | "unchanged";
  content: string;
  position: number;
  length: number;
  lineNumber?: number;
};

export type ComparisonSummary = {
  unchanged: number;
  modified: number;
  added: number;
  deleted: number;
};

export type ComparisonViewResult = {
  id1: number;
  id2: number;
  source1: string;
  source2: string;
  length1: number;
  length2: number;
  diffs1: ComparisonDiff[];
  diffs2: ComparisonDiff[];
  type: "words" | "bytes" | "lines";
  timestamp: Date;
  summary: ComparisonSummary;
};

export interface CompareSettings {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  showLineNumbers: boolean;
  syncScroll: boolean;
  maxItems: number;
  autoSave: boolean;
}

export type Result<T> =
  | { kind: "Success"; value: T }
  | { kind: "Error"; error: string };

export interface CompareStorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FileUploadResult {
  success: boolean;
  item?: CompareItem;
  error?: string;
}

export interface PanelDataResponse {
  items: CompareItem[];
  count: number;
  lastUpdated: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type CaidoBackendSDK = SDK;
