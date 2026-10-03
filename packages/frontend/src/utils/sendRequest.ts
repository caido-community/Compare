import { type CommandContext } from "@caido/sdk-frontend";
import { type AddItemInput, type AddRequestsInput, type Panel } from "shared";

import { buildUrl } from "./url";

export type SendRequest =
  | { kind: "Item"; input: AddItemInput }
  | { kind: "Requests"; input: AddRequestsInput }
  | { kind: "None" };

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
