import { err, ok } from "shared";
import { describe, expect, it } from "vitest";

import { applyInOrder, mapInOrder, toResult } from "./sequence";

const failOn = (bad: number) => (value: number) =>
  Promise.resolve(value === bad ? err(`failed on ${value}`) : ok(value * 10));

describe("applyInOrder", () => {
  it("keeps what succeeded before the first failure", async () => {
    const applied = await applyInOrder([1, 2, 3], failOn(2));

    expect(applied).toEqual({ done: [1], error: "failed on 2" });
    expect(toResult(applied)).toEqual(err("failed on 2"));
  });

  it("returns every entry when nothing fails", async () => {
    expect(toResult(await applyInOrder([1, 2], failOn(9)))).toEqual(ok([1, 2]));
  });
});

describe("mapInOrder", () => {
  it("maps every entry when nothing fails", async () => {
    expect(await mapInOrder([1, 2], failOn(9))).toEqual(ok([10, 20]));
  });

  it("stops at the first failure", async () => {
    const seen: number[] = [];

    const mapped = await mapInOrder([1, 2, 3], (value) => {
      seen.push(value);
      return failOn(2)(value);
    });

    expect(mapped).toEqual(err("failed on 2"));
    expect(seen).toEqual([1, 2]);
  });
});
