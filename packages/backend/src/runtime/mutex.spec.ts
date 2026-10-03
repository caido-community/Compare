import { describe, expect, it } from "vitest";

import { buildMutex } from "./mutex";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("buildMutex", () => {
  it("runs operations one after another in call order", async () => {
    const serialise = buildMutex();
    const events: string[] = [];

    await Promise.all([
      serialise(async () => {
        events.push("first start");
        await wait(10);
        events.push("first end");
      }),
      serialise(() => {
        events.push("second");
        return Promise.resolve();
      }),
    ]);

    expect(events).toEqual(["first start", "first end", "second"]);
  });

  it("keeps running after an operation fails", async () => {
    const serialise = buildMutex();

    const failed = serialise(() => Promise.reject(new Error("boom")));
    const next = serialise(() => Promise.resolve("ran"));

    await expect(failed).rejects.toThrow("boom");
    expect(await next).toBe("ran");
  });
});
