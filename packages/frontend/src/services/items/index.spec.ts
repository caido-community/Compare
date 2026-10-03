import { MAX_ITEM_BYTES } from "shared";
import { describe, expect, it } from "vitest";

import { chooseTransport } from "./index";

describe("chooseTransport", () => {
  it("sends small items directly", () => {
    expect(chooseTransport(1024)).toBe("Inline");
  });

  it("uploads large items instead of sending them over the plugin connection", () => {
    expect(chooseTransport(5 * 1024 * 1024)).toBe("Upload");
  });

  it("refuses items over the size limit", () => {
    expect(chooseTransport(MAX_ITEM_BYTES + 1)).toBe("TooLarge");
  });

  it("accepts an item exactly at the size limit", () => {
    expect(chooseTransport(MAX_ITEM_BYTES)).toBe("Upload");
  });
});
