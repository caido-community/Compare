import { type CommandContext, type RequestMeta } from "@caido/sdk-frontend";
import { describe, expect, it } from "vitest";

import { buildSendRequest } from "./index";

const ENDPOINT = {
  host: "example.com",
  port: 443,
  path: "/login",
  query: "next=1",
  isTls: true,
};

const requestMeta = (id: string): RequestMeta => ({
  type: "RequestMeta",
  id,
  ...ENDPOINT,
  streamId: undefined,
});

describe("buildSendRequest", () => {
  it("sends selected rows as request ids", () => {
    const context: CommandContext = {
      type: "RequestRowContext",
      requests: [requestMeta("1"), requestMeta("2")],
    };

    expect(buildSendRequest("original", context)).toEqual({
      kind: "Requests",
      input: { panel: "original", requestIds: ["1", "2"] },
    });
  });

  it("sends an open response with its request URL", () => {
    const context: CommandContext = {
      type: "ResponseContext",
      request: requestMeta("1"),
      response: {
        id: "7",
        raw: "HTTP/1.1 200 OK",
        statusCode: 200,
        roundtripTime: 5,
      },
      selection: "",
    };

    expect(buildSendRequest("modified", context)).toEqual({
      kind: "Item",
      input: {
        panel: "modified",
        kind: "response",
        source: "https://example.com/login?next=1",
        data: "HTTP/1.1 200 OK",
      },
    });
  });

  it("ignores contexts without a request", () => {
    const context: CommandContext = { type: "BaseContext" };

    expect(buildSendRequest("original", context)).toEqual({ kind: "None" });
  });
});
