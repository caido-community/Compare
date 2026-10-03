import { type CommandContext } from "@caido/sdk-frontend";
import {
  type AddItemInput,
  type AddRequestsInput,
  type Panel,
  PANELS,
} from "shared";

import { PANEL_TITLES } from "@/core/panels";
import { type Services } from "@/services";
import { type ItemService } from "@/services/items";
import { type FrontendSDK } from "@/types";

type Endpoint = {
  host: string;
  port: number;
  path: string;
  query: string;
  isTls: boolean;
};

export type SendRequest =
  | { kind: "Item"; input: AddItemInput }
  | { kind: "Requests"; input: AddRequestsInput }
  | { kind: "None" };

const MENU_TYPES = ["Request", "RequestRow", "Response"] as const;

export const buildUrl = (endpoint: Endpoint): string => {
  const scheme = endpoint.isTls ? "https" : "http";
  const isDefaultPort = endpoint.port === (endpoint.isTls ? 443 : 80);
  const port = isDefaultPort ? "" : `:${endpoint.port}`;
  const query = endpoint.query === "" ? "" : `?${endpoint.query}`;
  return `${scheme}://${endpoint.host}${port}${endpoint.path}${query}`;
};

export const buildSendRequest = (
  panel: Panel,
  context: CommandContext,
): SendRequest => {
  switch (context.type) {
    case "RequestRowContext":
      return {
        kind: "Requests",
        input: { panel, requestIds: context.requests.map((row) => row.id) },
      };
    case "RequestContext":
      return {
        kind: "Item",
        input: {
          panel,
          kind: "request",
          source: buildUrl(context.request),
          data: context.request.raw,
        },
      };
    case "ResponseContext":
      return {
        kind: "Item",
        input: {
          panel,
          kind: "response",
          source: buildUrl(context.request),
          data: context.response.raw,
        },
      };
    default:
      return { kind: "None" };
  }
};

const sendToBackend = (items: ItemService, request: SendRequest) => {
  switch (request.kind) {
    case "Requests":
      return items.addRequests(request.input);
    case "Item":
      return items.addItem(request.input);
    case "None":
      return undefined;
  }
};

const registerPanelCommand = (
  sdk: FrontendSDK,
  services: Services,
  panel: Panel,
) => {
  const id = `compare.send-to-${panel}`;
  const title = PANEL_TITLES[panel];

  sdk.commands.register(id, {
    name: `Send to ${title}`,
    run: async (context) => {
      const sent = await sendToBackend(
        services.items,
        buildSendRequest(panel, context),
      );
      if (sent === undefined) return;
      if (sent.kind === "Error") {
        services.notifications.showError(
          `Unable to send to ${title}: ${sent.error}`,
        );
        return;
      }
      services.notifications.showSuccess(`Sent to ${title}`);
    },
  });

  for (const type of MENU_TYPES) {
    sdk.menu.registerItem({
      type,
      commandId: id,
      leadingIcon: "fas fa-columns",
    });
  }
};

export const registerCommands = (sdk: FrontendSDK, services: Services) => {
  for (const panel of PANELS) {
    registerPanelCommand(sdk, services, panel);
  }
};
