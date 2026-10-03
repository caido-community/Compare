import { MAX_ITEM_BYTES } from "shared";
import { describe, expect, it } from "vitest";

import { chooseTransport, INLINE_LIMIT_BYTES } from "./index";

describe("chooseTransport", () => {
  it("sends items up to the inline limit directly", () => {
    expect(chooseTransport(INLINE_LIMIT_BYTES)).toBe("Inline");
  });

  it("uploads items above the inline limit", () => {
    expect(chooseTransport(INLINE_LIMIT_BYTES + 1)).toBe("Upload");
  });

  it("accepts an item exactly at the size limit", () => {
    expect(chooseTransport(MAX_ITEM_BYTES)).toBe("Upload");
  });

  it("refuses items over the size limit", () => {
    expect(chooseTransport(MAX_ITEM_BYTES + 1)).toBe("TooLarge");
  });
});
