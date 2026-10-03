import { describe, expect, it } from "vitest";

import { buildUrl } from "./url";

const ENDPOINT = {
  host: "example.com",
  port: 443,
  path: "/login",
  query: "next=1",
  isTls: true,
};

describe("buildUrl", () => {
  it("omits the default port", () => {
    expect(buildUrl(ENDPOINT)).toBe("https://example.com/login?next=1");
  });

  it("keeps a custom port and drops an empty query", () => {
    expect(buildUrl({ ...ENDPOINT, port: 8443, query: "" })).toBe(
      "https://example.com:8443/login",
    );
  });
});
