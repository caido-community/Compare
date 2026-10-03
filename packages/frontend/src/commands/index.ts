import { type CommandContext } from "@caido/sdk-frontend";
import {
  type AddItemInput,
  type AddRequestsInput,
  type Panel,
  PANELS,
} from "shared";

import { buildUrl } from "@/core/url";
import { PANEL_TITLES, SEND_LABELS } from "@/presentation/panels";
import { PLUGIN_ICON } from "@/presentation/plugin";
import { type Services } from "@/services";
import { type FrontendSDK } from "@/types";

type SendRequest =
  | { kind: "Item"; input: AddItemInput }
  | { kind: "Requests"; input: AddRequestsInput }
  | { kind: "None" };

const MENU_TYPES = ["Request", "RequestRow", "Response"] as const;

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

const send = (
  services: Services,
  request: Exclude<SendRequest, { kind: "None" }>,
) =>
  request.kind === "Requests"
    ? services.items.addRequests(request.input)
    : services.items.addItem(request.input);

const registerPanelCommand = (
  sdk: FrontendSDK,
  services: Services,
  panel: Panel,
) => {
  const id = `${__PLUGIN_ID__}.send-to-${panel}`;
  const title = PANEL_TITLES[panel];

  sdk.commands.register(id, {
    name: SEND_LABELS[panel],
    run: async (context) => {
      const request = buildSendRequest(panel, context);
      if (request.kind === "None") return;

      const sent = await send(services, request);
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
    sdk.menu.registerItem({ type, commandId: id, leadingIcon: PLUGIN_ICON });
  }
};

export const registerCommands = (sdk: FrontendSDK, services: Services) => {
  for (const panel of PANELS) {
    registerPanelCommand(sdk, services, panel);
  }
};
