import type { Caido } from "@caido/sdk-frontend";
import type { API } from "backend";
import type {
  CompareItem,
  CompareStorageResult,
  ComparisonDiff,
  ComparisonRequest,
  ComparisonResult,
  ComparisonSummary,
  ComparisonViewResult,
  FileUploadResult,
  PanelDataResponse,
} from "shared";

export type FrontendSDK = Caido<API, Record<string, never>>;

export type {
  CompareItem,
  CompareStorageResult,
  ComparisonDiff,
  ComparisonRequest,
  ComparisonResult,
  ComparisonSummary,
  ComparisonViewResult,
  FileUploadResult,
  PanelDataResponse,
};

export type CompareOptions = {
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
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

export type BackendAPI = {
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
};

export type BackendResult<T> =
  | { kind: "Success"; value: T }
  | { kind: "Error"; error: string };
