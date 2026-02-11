import type { DefineAPI, SDK } from "caido:plugin";

import { ComparisonError, StorageError } from "./errors";
import { CompareStore } from "./stores/compareStore";
import {
  type CompareItem,
  type CompareStorageResult,
  type ComparisonDiff,
  type ComparisonRequest,
  type ComparisonResult,
  type ComparisonSummary,
  type ComparisonViewResult,
  type FileUploadResult,
  type PanelDataResponse,
  type Result,
  type ValidationResult,
} from "./types";
import {
  clearPanelFiles,
  deleteItemFile,
  ensureCompareDirectories,
  loadAllItemsFromFiles,
  saveItemToFile,
} from "./utils/fileUtils";
import { IdGenerator } from "./utils/idGenerator";

export type {
  ComparisonDiff,
  ComparisonRequest,
  ComparisonResult,
  ComparisonSummary,
  ComparisonViewResult,
};

const createPreview = (data: string, maxLength: number = 100): string => {
  if (data.length <= maxLength) return data;
  return data.substring(0, maxLength) + "...";
};

const generateId = (): number => {
  return IdGenerator.get().generateId();
};

const validateItemData = (data: string): ValidationResult => {
  const errors: string[] = [];

  if (typeof data !== "string") {
    errors.push("Data must be a string");
  }

  if (data.length === 0) {
    errors.push("Data cannot be empty");
  }

  if (data.length > 10 * 1024 * 1024) {
    // 10MB limit for performance
    errors.push(
      "File size exceeds 10MB limit. Large files may cause performance issues.",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

const saveItemToPanel = async (
  sdk: SDK,
  panelNumber: 1 | 2,
  data: string,
  type: CompareItem["type"],
  source?: string,
  metadata?: Record<string, unknown>,
): Promise<CompareStorageResult<CompareItem>> => {
  const validation = validateItemData(data);
  if (!validation.valid) {
    return {
      success: false,
      error: `Validation failed: ${validation.errors.join(", ")}`,
    };
  }

  const item: CompareItem = {
    id: generateId(),
    length: data.length,
    data: data,
    preview: createPreview(data),
    timestamp: new Date(),
    type: type,
    source: source,
    metadata: metadata || {},
  };

  try {
    const store = CompareStore.get();
    store.addPanelItem(panelNumber, item);

    const fileSaved = await saveItemToFile(sdk, panelNumber, item);
    if (!fileSaved) {
      // If file save fails, remove from memory store to maintain consistency
      store.deletePanelItem(panelNumber, item.id);
      return {
        success: false,
        error: "Failed to save item to file storage",
      };
    }

    return { success: true, data: item };
  } catch (error) {
    sdk.console.error(
      `Compare: Error saving item to ${panelNumber === 1 ? "Original" : "Modified"}: ${(error as Error).message}`,
    );
    return {
      success: false,
      error: `Failed to save item: ${(error as Error).message}`,
    };
  }
};

const loadPanelData = (
  sdk: SDK,
  panelNumber: 1 | 2,
): Promise<CompareStorageResult<PanelDataResponse>> => {
  try {
    const store = CompareStore.get();
    const items = store.getPanelItems(panelNumber);

    const response: PanelDataResponse = {
      items: items,
      count: items.length,
      lastUpdated: new Date(),
    };

    return Promise.resolve({ success: true, data: response });
  } catch (error) {
    sdk.console.error(
      `Compare: Failed to load panel data: ${(error as Error).message}`,
    );
    return Promise.resolve({
      success: false,
      error: `Failed to load ${panelNumber === 1 ? "Original" : "Modified"} data: ${(error as Error).message}`,
    });
  }
};

const removeItemFromPanel = async (
  sdk: SDK,
  panelNumber: 1 | 2,
  itemId: number,
): Promise<Result<void>> => {
  try {
    const store = CompareStore.get();

    const item = store.getPanelItem(panelNumber, itemId);
    if (!item) {
      return {
        kind: "Error",
        error: `Item ${itemId} not found in ${panelNumber === 1 ? "Original" : "Modified"}`,
      };
    }

    await deleteItemFile(sdk, panelNumber, itemId);

    store.deletePanelItem(panelNumber, itemId);

    return { kind: "Success", value: undefined };
  } catch (error) {
    sdk.console.error(
      `Compare: Error removing item ${itemId}: ${(error as Error).message}`,
    );
    return {
      kind: "Error",
      error: `Failed to remove item: ${(error as Error).message}`,
    };
  }
};

const clearPanelData = async (
  sdk: SDK,
  panelNumber: 1 | 2,
): Promise<Result<void>> => {
  try {
    const store = CompareStore.get();

    await clearPanelFiles(sdk, panelNumber);

    store.clearPanel(panelNumber);

    return { kind: "Success", value: undefined };
  } catch (error) {
    sdk.console.error(
      `Compare: Error clearing panel: ${(error as Error).message}`,
    );
    return {
      kind: "Error",
      error: `Failed to clear ${panelNumber === 1 ? "Original" : "Modified"}: ${(error as Error).message}`,
    };
  }
};

const processFileUpload = (
  sdk: SDK,
  fileContent: string,
  filename?: string,
): Promise<FileUploadResult> => {
  try {
    const validation = validateItemData(fileContent);
    if (!validation.valid) {
      return Promise.resolve({
        success: false,
        error: `File validation failed: ${validation.errors.join(", ")}`,
      });
    }

    const item: CompareItem = {
      id: generateId(),
      length: fileContent.length,
      data: fileContent,
      preview: createPreview(fileContent),
      timestamp: new Date(),
      type: "file",
      source: filename !== undefined ? filename : "uploaded_file",
      metadata: {
        filename: filename,
        uploadedAt: new Date().toISOString(),
      },
    };

    return Promise.resolve({ success: true, item });
  } catch (error) {
    return Promise.resolve({
      success: false,
      error: `File processing failed: ${(error as Error).message}`,
    });
  }
};

const processClipboardData = (
  sdk: SDK,
  clipboardContent: string,
): Promise<FileUploadResult> => {
  try {
    const validation = validateItemData(clipboardContent);
    if (!validation.valid) {
      return Promise.resolve({
        success: false,
        error: `Clipboard validation failed: ${validation.errors.join(", ")}`,
      });
    }

    const item: CompareItem = {
      id: generateId(),
      length: clipboardContent.length,
      data: clipboardContent,
      preview: createPreview(clipboardContent),
      timestamp: new Date(),
      type: "clipboard",
      source: "clipboard",
      metadata: {
        pastedAt: new Date().toISOString(),
      },
    };

    return Promise.resolve({ success: true, item });
  } catch (error) {
    return Promise.resolve({
      success: false,
      error: `Clipboard processing failed: ${(error as Error).message}`,
    });
  }
};

const processHttpRequest = (
  sdk: SDK,
  requestData: unknown,
): Promise<FileUploadResult> => {
  try {
    const req = requestData as Record<string, unknown> | undefined;
    const requestString =
      typeof req?.raw === "string"
        ? req.raw
        : typeof requestData === "object" &&
            requestData !== null &&
            "toString" in requestData &&
            typeof (requestData as { toString: () => string }).toString ===
              "function"
          ? (requestData as { toString: () => string }).toString()
          : JSON.stringify(requestData);

    const validation = validateItemData(requestString);
    if (!validation.valid) {
      return Promise.resolve({
        success: false,
        error: `Request validation failed: ${validation.errors.join(", ")}`,
      });
    }

    const item: CompareItem = {
      id: generateId(),
      length: requestString.length,
      data: requestString,
      preview: createPreview(requestString),
      timestamp: new Date(),
      type: "request",
      source: typeof req?.url === "string" ? req.url : "http_request",
      metadata: {
        method: req?.method,
        url: req?.url,
        processedAt: new Date().toISOString(),
      },
    };

    return Promise.resolve({ success: true, item });
  } catch (error) {
    return Promise.resolve({
      success: false,
      error: `Request processing failed: ${(error as Error).message}`,
    });
  }
};

const processHttpResponse = (
  sdk: SDK,
  responseData: unknown,
): Promise<FileUploadResult> => {
  try {
    const res = responseData as Record<string, unknown> | undefined;
    const responseString =
      typeof res?.raw === "string"
        ? res.raw
        : typeof responseData === "object" &&
            responseData !== null &&
            "toString" in responseData &&
            typeof (responseData as { toString: () => string }).toString ===
              "function"
          ? (responseData as { toString: () => string }).toString()
          : JSON.stringify(responseData);

    const validation = validateItemData(responseString);
    if (!validation.valid) {
      return Promise.resolve({
        success: false,
        error: `Response validation failed: ${validation.errors.join(", ")}`,
      });
    }

    const item: CompareItem = {
      id: generateId(),
      length: responseString.length,
      data: responseString,
      preview: createPreview(responseString),
      timestamp: new Date(),
      type: "response",
      source: typeof res?.url === "string" ? res.url : "http_response",
      metadata: {
        status: res?.status,
        url: res?.url,
        processedAt: new Date().toISOString(),
      },
    };

    return Promise.resolve({ success: true, item });
  } catch (error) {
    return Promise.resolve({
      success: false,
      error: `Response processing failed: ${(error as Error).message}`,
    });
  }
};

/**
 * Stub for comparison API. Actual diffing runs in the frontend (comparisonEngine).
 * Kept for API consistency and possible future server-side comparison.
 * Callers should use the frontend comparison flow for real results.
 */
const performComparison = (
  sdk: SDK,
  request: ComparisonRequest,
): ComparisonResult => {
  const { item1, item2, type } = request;

  if (item1 === undefined || item2 === undefined) {
    throw new ComparisonError("Both items are required for comparison");
  }

  const result: ComparisonResult = {
    type,
    differences: [],
    summary: {
      added: 0,
      deleted: 0,
      modified: 0,
      total: 0,
    },
  };

  return result;
};

const getStorageStats = async (
  sdk: SDK,
): Promise<CompareStorageResult<unknown>> => {
  try {
    const store = CompareStore.get();
    const stats = store.getStats();

    return Promise.resolve({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return Promise.resolve({
      success: false,
      error: `Failed to get storage stats: ${(error as Error).message}`,
    });
  }
};

const addRequestToPanel = async (
  sdk: SDK,
  panelNumber: 1 | 2,
  rawRequest: string,
  targetUrl: string,
  originalRequest: unknown,
): Promise<string> => {
  try {
    const requestId = `req_${Date.now()}_${++requestCounter}`;

    if (rawRequest.trim() === "") {
      throw new StorageError("Raw request data is required");
    }

    const methodMatch = rawRequest.match(/^([A-Z]+)\s+/);
    const method = methodMatch?.[1] !== undefined ? methodMatch[1] : "UNKNOWN";

    const orig = originalRequest as Record<string, unknown> | undefined;
    const newItem: CompareItem = {
      id: generateId(),
      length: rawRequest.length,
      data: rawRequest,
      preview: `${method} ${targetUrl}`.substring(0, 100),
      type: "request",
      timestamp: new Date(),
      source: targetUrl,
      metadata: {
        method,
        url: targetUrl,
        host: orig?.host,
        port: orig?.port,
        isTls: orig?.isTls,
      },
    };

    const store = CompareStore.get();
    store.addPanelItem(panelNumber, newItem);

    const fileSaved = await saveItemToFile(sdk, panelNumber, newItem);
    if (!fileSaved) {
      store.deletePanelItem(panelNumber, newItem.id);
      throw new StorageError("Failed to save item to file storage");
    }

    return requestId;
  } catch (error) {
    sdk.console.error(
      `Compare: Error adding request to panel: ${(error as Error).message}`,
    );
    throw error;
  }
};

let requestCounter = 0;

const addResponseToPanel = async (
  sdk: SDK,
  panelNumber: 1 | 2,
  rawResponse: string,
  sourceUrl: string,
  originalResponse: unknown,
): Promise<string> => {
  try {
    const responseId = `resp_${Date.now()}_${++requestCounter}`;

    if (rawResponse.trim() === "") {
      throw new StorageError("Raw response data is required");
    }

    const statusMatch = rawResponse.match(/^HTTP\/[\d.]+\s+(\d+)/);
    const statusCode =
      statusMatch?.[1] !== undefined ? statusMatch[1] : "UNKNOWN";

    const origResp = originalResponse as Record<string, unknown> | undefined;
    const newItem: CompareItem = {
      id: generateId(),
      length: rawResponse.length,
      data: rawResponse,
      preview: `${statusCode} ${sourceUrl}`.substring(0, 100),
      type: "response",
      timestamp: new Date(),
      source: sourceUrl,
      metadata: {
        statusCode,
        url: sourceUrl,
        host: origResp?.host,
        port: origResp?.port,
        isTls: origResp?.isTls,
      },
    };

    const store = CompareStore.get();
    store.addPanelItem(panelNumber, newItem);

    const fileSaved = await saveItemToFile(sdk, panelNumber, newItem);
    if (!fileSaved) {
      store.deletePanelItem(panelNumber, newItem.id);
      throw new StorageError("Failed to save item to file storage");
    }

    return responseId;
  } catch (error) {
    sdk.console.error(
      `Compare: Error adding response to panel: ${(error as Error).message}`,
    );
    throw error;
  }
};

const initializeStorage = async (sdk: SDK): Promise<boolean> => {
  try {
    const directoriesReady = await ensureCompareDirectories(sdk);
    if (!directoriesReady) {
      sdk.console.error("Failed to create storage directories");
      return false;
    }

    const { panel1, panel2 } = await loadAllItemsFromFiles(sdk);

    const store = CompareStore.get();
    store.loadPanelItems(1, panel1);
    store.loadPanelItems(2, panel2);

    const idGenerator = IdGenerator.get();
    idGenerator.initialize();

    return true;
  } catch (error) {
    sdk.console.error(
      "Failed to initialize storage: " + (error as Error).message,
    );
    return false;
  }
};

export type API = DefineAPI<{
  // Data management API
  saveItemToPanel: typeof saveItemToPanel;
  loadPanelData: typeof loadPanelData;
  removeItemFromPanel: typeof removeItemFromPanel;
  clearPanelData: typeof clearPanelData;

  // File and data processing API
  processFileUpload: typeof processFileUpload;
  processClipboardData: typeof processClipboardData;
  processHttpRequest: typeof processHttpRequest;
  processHttpResponse: typeof processHttpResponse;

  // Comparison API
  performComparison: typeof performComparison;

  // Context menu API
  addRequestToPanel: typeof addRequestToPanel;
  addResponseToPanel: typeof addResponseToPanel;

  // Storage management API
  getStorageStats: typeof getStorageStats;
}>;

export function init(sdk: SDK<API>) {
  sdk.console.log("Compare Plugin Backend: Initializing...");

  sdk.events.onProjectChange(async (sdk, project) => {
    const projectName = project?.getName() ?? "Unknown";
    const store = CompareStore.get();
    store.clearPanel(1);
    store.clearPanel(2);

    const success = await initializeStorage(sdk);
    if (success === true) {
      sdk.console.log(
        `Compare Plugin: Storage reinitialized for project "${projectName}"`,
      );
    } else {
      sdk.console.error(
        `Compare Plugin: Failed to reinitialize storage for project "${projectName}"`,
      );
    }
  });

  void initializeStorage(sdk).then((success) => {
    if (success === true) {
      sdk.console.log(
        "Compare Plugin Backend: Storage initialized successfully",
      );
    } else {
      sdk.console.error(
        "Compare Plugin Backend: Storage initialization failed",
      );
    }
  });

  sdk.api.register("saveItemToPanel", saveItemToPanel);
  sdk.api.register("loadPanelData", loadPanelData);
  sdk.api.register("removeItemFromPanel", removeItemFromPanel);
  sdk.api.register("clearPanelData", clearPanelData);

  sdk.api.register("processFileUpload", processFileUpload);
  sdk.api.register("processClipboardData", processClipboardData);
  sdk.api.register("processHttpRequest", processHttpRequest);
  sdk.api.register("processHttpResponse", processHttpResponse);

  sdk.api.register("performComparison", performComparison);
  sdk.api.register("addRequestToPanel", addRequestToPanel);
  sdk.api.register("addResponseToPanel", addResponseToPanel);

  sdk.api.register("getStorageStats", getStorageStats);

  sdk.console.log(
    "Compare Plugin Backend: Successfully initialized with correct storage pattern",
  );
}
