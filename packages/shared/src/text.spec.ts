import { describe, expect, it } from "vitest";

import { measureBytes } from "./text";

describe("measureBytes", () => {
  it("matches the UTF-8 encoded size", () => {
    for (const text of [
      "",
      "abc",
      "é",
      "日本",
      "😀",
      "a😀é日",
      "\ud800a",
      "a\udc00",
    ]) {
      expect(measureBytes(text)).toBe(Buffer.byteLength(text, "utf8"));
    }
  });
});
