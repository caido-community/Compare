import type { Caido } from "@caido/sdk-frontend";
import type {
  API,
  ComparisonDiff,
  ComparisonRequest,
  ComparisonSummary,
  ComparisonViewResult,
} from "backend";

export type FrontendSDK = Caido<API, Record<string, never>>;

export type { ComparisonDiff, ComparisonSummary, ComparisonViewResult };

export type CompareOptions = {
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
};

export type CompareItem = {
  id: number;
  length: number;
  data: string;
  preview: string;
  timestamp: Date;
  type: "request" | "response" | "file" | "clipboard";
  source?: string;
  metadata?: Record<string, unknown>;
};

export type ComparisonResult = {
  type: "words" | "bytes" | "characters";
  differences: ComparisonDifference[];
  summary: {
    added: number;
    deleted: number;
    modified: number;
    total: number;
  };
};

export type ComparisonDifference = {
  type: "added" | "deleted" | "modified";
  position: number;
  length: number;
  content: string;
  lineNumber?: number;
};

export type CompareSettings = {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  showLineNumbers: boolean;
  syncScroll: boolean;
  maxItems: number;
  autoSave: boolean;
};

export type CompareStorageResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PanelDataResponse = {
  items: CompareItem[];
  count: number;
  lastUpdated: Date;
};

export type FileUploadResult = {
  success: boolean;
  item?: CompareItem;
  error?: string;
};

export type UIState = {
  loading: boolean;
  error: string | undefined;
  comparisonInProgress: boolean;
  showComparisonModal: boolean;
};

export type PanelState = {
  items: CompareItem[];
  selectedItems: CompareItem[];
  loading: boolean;
  error: string | undefined;
};

export type CompareProps = Record<string, never>;

export type CompareEmits = Record<string, never>;

// API call types for better type safety
export interface BackendAPI {
  saveItemToPanel(
    panelNumber: 1 | 2,
    data: string,
    type: CompareItem["type"],
    source?: string,
    metadata?: Record<string, unknown>,
  ): Promise<CompareStorageResult<CompareItem>>;
  loadPanelData(
    panelNumber: 1 | 2,
  ): Promise<CompareStorageResult<PanelDataResponse>>;
  removeItemFromPanel(
    panelNumber: 1 | 2,
    itemId: number,
  ): Promise<CompareStorageResult<void>>;
  clearPanelData(panelNumber: 1 | 2): Promise<CompareStorageResult<void>>;
  processFileUpload(
    fileContent: string,
    filename?: string,
  ): Promise<FileUploadResult>;
  processClipboardData(clipboardContent: string): Promise<FileUploadResult>;
  processHttpRequest(requestData: unknown): Promise<FileUploadResult>;
  processHttpResponse(responseData: unknown): Promise<FileUploadResult>;
  performComparison(request: ComparisonRequest): Promise<ComparisonResult>;
  getStorageStats(): Promise<CompareStorageResult<unknown>>;
  validateStorage(): Promise<CompareStorageResult<boolean>>;
}

export type BackendResult<T> =
  | { kind: "Success"; value: T }
  | { kind: "Error"; error: string };
