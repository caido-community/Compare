import { Classic } from "@caido/primevue";
import PrimeVue from "primevue/config";
import { createApp } from "vue";

import { SDKPlugin } from "./plugins/sdk";
import "./styles/index.css";
import type { FrontendSDK } from "./types";
import App from "./views/App.vue";

// Command definitions for the plugin
const Commands = {
  sendToOriginal: "compare.send-to-original",
  sendToModified: "compare.send-to-modified",
  sendRowsToOriginal: "compare.send-rows-to-original",
  sendRowsToModified: "compare.send-rows-to-modified",
  sendResponseToOriginal: "compare.send-response-to-original",
  sendResponseToModified: "compare.send-response-to-modified",
} as const;

type RequestContext = {
  request?: {
    raw?: string | { toText?: () => string };
    host?: string;
    path?: string;
    id?: string;
    port?: number;
    isTls?: boolean;
    query?: string;
  };
};

const sendToOriginal = async (sdk: FrontendSDK, context: RequestContext) => {
  try {
    const request = context.request ?? context;
    if (request === undefined || request === null) {
      throw new Error("No request found in context");
    }

    const req = request as Record<string, unknown>;
    const raw =
      typeof req.raw === "string"
        ? req.raw
        : typeof (req.raw as { toText?: () => string })?.toText === "function"
          ? (req.raw as { toText: () => string }).toText()
          : "";
    const host = typeof req.host === "string" ? req.host : "unknown";
    const port = typeof req.port === "number" ? req.port : 80;
    const isTls = req.isTls === true;
    const targetUrl = `${isTls ? "https" : "http"}://${host}:${port}`;

    await sdk.backend.addRequestToPanel(1, raw, targetUrl, request);

    window.dispatchEvent(
      new CustomEvent("compare-data-updated", { detail: { panel: 1 } }),
    );

    sdk.window.showToast("Request sent to Original", {
      variant: "success",
      duration: 3000,
    });
  } catch (error) {
    sdk.window.showToast(
      `Failed to send request: ${error instanceof Error ? error.message : "Unknown error"}`,
      { variant: "error", duration: 3000 },
    );
  }
};

const sendToModified = async (sdk: FrontendSDK, context: RequestContext) => {
  try {
    const request = context.request ?? context;
    if (request === undefined || request === null) {
      throw new Error("No request found in context");
    }

    const req = request as Record<string, unknown>;
    const raw =
      typeof req.raw === "string"
        ? req.raw
        : typeof (req.raw as { toText?: () => string })?.toText === "function"
          ? (req.raw as { toText: () => string }).toText()
          : "";
    const host = typeof req.host === "string" ? req.host : "unknown";
    const port = typeof req.port === "number" ? req.port : 80;
    const isTls = req.isTls === true;
    const targetUrl = `${isTls ? "https" : "http"}://${host}:${port}`;

    await sdk.backend.addRequestToPanel(2, raw, targetUrl, request);

    window.dispatchEvent(
      new CustomEvent("compare-data-updated", { detail: { panel: 2 } }),
    );

    sdk.window.showToast("Request sent to Modified", {
      variant: "success",
      duration: 3000,
    });
  } catch (error) {
    sdk.window.showToast(
      `Failed to send request: ${error instanceof Error ? error.message : "Unknown error"}`,
      { variant: "error", duration: 3000 },
    );
  }
};

// Context menu command handler for request rows
type RequestRowContext = { requests?: unknown[] };

const sendRowsToOriginal = async (
  sdk: FrontendSDK,
  context: RequestRowContext,
) => {
  try {
    const requests = context.requests;
    if (
      requests === undefined ||
      !Array.isArray(requests) ||
      requests.length === 0
    ) {
      throw new Error("No requests selected");
    }

    const requestsSlice = requests.slice(0, 25);
    const requestsToProcess: Array<{
      rawRequest: string;
      targetUrl: string;
      originalRequest: unknown;
    }> = [];

    for (const request of requestsSlice) {
      try {
        const req = request as Record<string, unknown>;
        if (req === undefined || req.id === undefined) {
          continue;
        }

        let requestId: string;
        if (typeof req.id === "string") {
          requestId = req.id;
        } else if (typeof req.id === "number") {
          requestId = String(req.id);
        } else {
          continue;
        }
        const fullRequest = await sdk.graphql.request({ id: requestId });
        if (fullRequest.request?.raw === undefined) {
          continue;
        }

        let rawRequest: string;
        if (typeof fullRequest.request.raw === "string") {
          rawRequest = fullRequest.request.raw;
        } else if (
          fullRequest.request.raw &&
          typeof fullRequest.request.raw === "object" &&
          "toText" in fullRequest.request.raw
        ) {
          rawRequest = (
            fullRequest.request.raw as { toText: () => string }
          ).toText();
        } else {
          rawRequest = String(fullRequest.request.raw);
        }

        if (rawRequest.trim() === "") {
          continue;
        }

        const host =
          (req.host as string) ?? fullRequest.request.host ?? "unknown";
        const port = (req.port as number) ?? fullRequest.request.port ?? 80;
        const isTls =
          req.isTls !== undefined ? req.isTls === true : port === 443;
        const targetUrl = `${isTls ? "https" : "http"}://${host}${port !== (isTls ? 443 : 80) ? `:${port}` : ""}`;

        requestsToProcess.push({
          rawRequest,
          targetUrl,
          originalRequest: fullRequest.request,
        });
      } catch (error) {
        void error;
      }
    }

    if (requestsToProcess.length === 0) {
      throw new Error("No valid requests to process");
    }

    for (const {
      rawRequest,
      targetUrl,
      originalRequest,
    } of requestsToProcess) {
      await sdk.backend.addRequestToPanel(
        1,
        rawRequest,
        targetUrl,
        originalRequest,
      );
    }

    window.dispatchEvent(
      new CustomEvent("compare-data-updated", { detail: { panel: 1 } }),
    );

    sdk.window.showToast(
      `${requestsToProcess.length} request(s) sent to Original`,
      { variant: "success", duration: 3000 },
    );
  } catch (error) {
    sdk.window.showToast(
      `Failed to send requests: ${error instanceof Error ? error.message : "Unknown error"}`,
      { variant: "error", duration: 3000 },
    );
  }
};

const sendRowsToModified = async (
  sdk: FrontendSDK,
  context: RequestRowContext,
) => {
  try {
    const requests = context.requests;
    if (
      requests === undefined ||
      !Array.isArray(requests) ||
      requests.length === 0
    ) {
      throw new Error("No requests selected");
    }

    const requestsSlice = requests.slice(0, 25);
    const requestsToProcess: Array<{
      rawRequest: string;
      targetUrl: string;
      originalRequest: unknown;
    }> = [];

    for (const request of requestsSlice) {
      try {
        const req = request as Record<string, unknown>;
        if (req === undefined || req.id === undefined) {
          continue;
        }

        let requestId: string;
        if (typeof req.id === "string") {
          requestId = req.id;
        } else if (typeof req.id === "number") {
          requestId = String(req.id);
        } else {
          continue;
        }
        const fullRequest = await sdk.graphql.request({ id: requestId });
        if (fullRequest.request?.raw === undefined) {
          continue;
        }

        let rawRequest: string;
        if (typeof fullRequest.request.raw === "string") {
          rawRequest = fullRequest.request.raw;
        } else if (
          fullRequest.request.raw &&
          typeof fullRequest.request.raw === "object" &&
          "toText" in fullRequest.request.raw
        ) {
          rawRequest = (
            fullRequest.request.raw as { toText: () => string }
          ).toText();
        } else {
          rawRequest = String(fullRequest.request.raw);
        }

        if (rawRequest.trim() === "") {
          continue;
        }

        const host =
          (req.host as string) ?? fullRequest.request.host ?? "unknown";
        const port = (req.port as number) ?? fullRequest.request.port ?? 80;
        const isTls =
          req.isTls !== undefined ? req.isTls === true : port === 443;
        const targetUrl = `${isTls ? "https" : "http"}://${host}${port !== (isTls ? 443 : 80) ? `:${port}` : ""}`;

        requestsToProcess.push({
          rawRequest,
          targetUrl,
          originalRequest: fullRequest.request,
        });
      } catch (error) {
        void error;
      }
    }

    if (requestsToProcess.length === 0) {
      throw new Error("No valid requests to process");
    }

    for (const {
      rawRequest,
      targetUrl,
      originalRequest,
    } of requestsToProcess) {
      await sdk.backend.addRequestToPanel(
        2,
        rawRequest,
        targetUrl,
        originalRequest,
      );
    }

    window.dispatchEvent(
      new CustomEvent("compare-data-updated", { detail: { panel: 2 } }),
    );

    sdk.window.showToast(
      `${requestsToProcess.length} request(s) sent to Modified`,
      { variant: "success", duration: 3000 },
    );
  } catch (error) {
    sdk.window.showToast(
      `Failed to send requests: ${error instanceof Error ? error.message : "Unknown error"}`,
      { variant: "error", duration: 3000 },
    );
  }
};

type ResponseContext = {
  response?: { raw?: string | { toText?: () => string } };
  request?: { host?: string; path?: string; port?: number; isTls?: boolean };
};

const sendResponseToOriginal = async (
  sdk: FrontendSDK,
  context: ResponseContext,
) => {
  try {
    const response = context.response;
    if (response === undefined) {
      throw new Error("No response found in context");
    }

    const raw =
      typeof response.raw === "string"
        ? response.raw
        : typeof (response.raw as { toText?: () => string })?.toText ===
            "function"
          ? (response.raw as { toText: () => string }).toText()
          : "";
    if (raw.trim() === "") {
      throw new Error("Empty response data");
    }

    let sourceUrl = "http_response";
    const req = context.request;
    if (req !== undefined) {
      const host = req.host ?? "unknown";
      const port = req.port ?? 80;
      const isTls = req.isTls === true;
      sourceUrl = `${isTls ? "https" : "http"}://${host}:${port}${req.path ?? "/"}`;
    }

    await sdk.backend.addResponseToPanel(1, raw, sourceUrl, {
      host: req?.host,
      port: req?.port,
      isTls: req?.isTls,
    });

    window.dispatchEvent(
      new CustomEvent("compare-data-updated", { detail: { panel: 1 } }),
    );

    sdk.window.showToast("Response sent to Original", {
      variant: "success",
      duration: 3000,
    });
  } catch (error) {
    sdk.window.showToast(
      `Failed to send response: ${error instanceof Error ? error.message : "Unknown error"}`,
      { variant: "error", duration: 3000 },
    );
  }
};

const sendResponseToModified = async (
  sdk: FrontendSDK,
  context: ResponseContext,
) => {
  try {
    const response = context.response;
    if (response === undefined) {
      throw new Error("No response found in context");
    }

    const raw =
      typeof response.raw === "string"
        ? response.raw
        : typeof (response.raw as { toText?: () => string })?.toText ===
            "function"
          ? (response.raw as { toText: () => string }).toText()
          : "";
    if (raw.trim() === "") {
      throw new Error("Empty response data");
    }

    let sourceUrl = "http_response";
    const req = context.request;
    if (req !== undefined) {
      const host = req.host ?? "unknown";
      const port = req.port ?? 80;
      const isTls = req.isTls === true;
      sourceUrl = `${isTls ? "https" : "http"}://${host}:${port}${req.path ?? "/"}`;
    }

    await sdk.backend.addResponseToPanel(2, raw, sourceUrl, {
      host: req?.host,
      port: req?.port,
      isTls: req?.isTls,
    });

    window.dispatchEvent(
      new CustomEvent("compare-data-updated", { detail: { panel: 2 } }),
    );

    sdk.window.showToast("Response sent to Modified", {
      variant: "success",
      duration: 3000,
    });
  } catch (error) {
    sdk.window.showToast(
      `Failed to send response: ${error instanceof Error ? error.message : "Unknown error"}`,
      { variant: "error", duration: 3000 },
    );
  }
};

// This is the entry point for the frontend plugin
export const init = (sdk: FrontendSDK) => {
  const app = createApp(App);

  app.use(PrimeVue, {
    unstyled: true,
    pt: Classic,
  });

  app.use(SDKPlugin, sdk);

  const root = document.createElement("div");
  Object.assign(root.style, {
    height: "100%",
    width: "100%",
  });

  root.id = `plugin--compare`;

  app.mount(root);

  sdk.navigation.addPage("/compare", {
    body: root,
  });

  sdk.sidebar.registerItem("Compare", "/compare", {
    icon: "fas fa-columns",
  });

  sdk.commands.register(Commands.sendToOriginal, {
    name: "Send to Original",
    run: (context) => sendToOriginal(sdk, context as RequestContext),
  });

  sdk.commands.register(Commands.sendToModified, {
    name: "Send to Modified",
    run: (context) => sendToModified(sdk, context as RequestContext),
  });

  sdk.commands.register(Commands.sendRowsToOriginal, {
    name: "Send to Original",
    run: (context) => sendRowsToOriginal(sdk, context as RequestRowContext),
  });

  sdk.commands.register(Commands.sendRowsToModified, {
    name: "Send to Modified",
    run: (context) => sendRowsToModified(sdk, context as RequestRowContext),
  });

  // Register context menu item for individual requests
  sdk.menu.registerItem({
    type: "Request",
    commandId: Commands.sendToOriginal,
    leadingIcon: "fas fa-columns",
  });

  sdk.menu.registerItem({
    type: "Request",
    commandId: Commands.sendToModified,
    leadingIcon: "fas fa-columns",
  });

  // Register context menu item for request rows (table view)
  sdk.menu.registerItem({
    type: "RequestRow",
    commandId: Commands.sendRowsToOriginal,
    leadingIcon: "fas fa-columns",
  });

  sdk.menu.registerItem({
    type: "RequestRow",
    commandId: Commands.sendRowsToModified,
    leadingIcon: "fas fa-columns",
  });

  // Register context menu commands for responses
  sdk.commands.register(Commands.sendResponseToOriginal, {
    name: "Send to Original",
    run: (context) => sendResponseToOriginal(sdk, context as ResponseContext),
  });

  sdk.commands.register(Commands.sendResponseToModified, {
    name: "Send to Modified",
    run: (context) => sendResponseToModified(sdk, context as ResponseContext),
  });

  // Register context menu items for responses
  sdk.menu.registerItem({
    type: "Response",
    commandId: Commands.sendResponseToOriginal,
    leadingIcon: "fas fa-columns",
  });

  sdk.menu.registerItem({
    type: "Response",
    commandId: Commands.sendResponseToModified,
    leadingIcon: "fas fa-columns",
  });
};
