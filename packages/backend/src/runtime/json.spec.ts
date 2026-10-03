import { ok } from "shared";
import { describe, expect, it } from "vitest";

import { buildMemoryFileSystem } from "../tests/memoryFileSystem";

import { readJsonDirectory, readJsonFile } from "./json";

describe("readJsonFile", () => {
  it("tells a missing file apart from invalid JSON", async () => {
    const fileSystem = buildMemoryFileSystem();
    fileSystem.files.set("/bad.json", "{oops");

    expect(await readJsonFile(fileSystem, "/none.json")).toEqual(
      ok({ kind: "Missing" }),
    );
    expect(await readJsonFile(fileSystem, "/bad.json")).toEqual(
      ok({ kind: "Invalid" }),
    );
  });

  it("parses a valid file", async () => {
    const fileSystem = buildMemoryFileSystem();
    fileSystem.files.set("/good.json", '{ "a": 1 }');

    expect(await readJsonFile(fileSystem, "/good.json")).toEqual(
      ok({ kind: "Found", value: { a: 1 } }),
    );
  });
});

describe("readJsonDirectory", () => {
  it("returns the valid JSON files and skips the rest", async () => {
    const fileSystem = buildMemoryFileSystem();
    fileSystem.files.set("/dir/1.json", '{ "id": 1 }');
    fileSystem.files.set("/dir/2.json", "{oops");
    fileSystem.files.set("/dir/notes.txt", "ignored");

    expect(await readJsonDirectory(fileSystem, "/dir")).toEqual(
      ok([{ id: 1 }]),
    );
  });
});
