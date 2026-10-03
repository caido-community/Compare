import { mkdtemp, rm } from "fs/promises";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildFileSystem, buildPath } from "./fileSystem";

const fileSystem = buildFileSystem();

let root = "";

beforeEach(async () => {
  root = await mkdtemp(".tmp-compare-");
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("buildFileSystem", () => {
  it("writes into missing folders and reads the content back", async () => {
    const path = buildPath(root, "nested", "item.json");

    expect(await fileSystem.writeTextFile(path, "hello")).toEqual({
      kind: "Written",
    });
    expect(await fileSystem.readTextFile(path)).toEqual({
      kind: "Found",
      content: "hello",
    });
    expect(await fileSystem.readFileSize(path)).toEqual({
      kind: "Found",
      bytes: 5,
    });
  });

  it("reports missing files and folders without failing", async () => {
    const missing = buildPath(root, "missing.json");

    expect(await fileSystem.readTextFile(missing)).toEqual({ kind: "Missing" });
    expect(await fileSystem.readFileSize(missing)).toEqual({ kind: "Missing" });
    expect(await fileSystem.listFileNames(missing)).toEqual({
      kind: "Listed",
      names: [],
    });
    expect(await fileSystem.removeFile(missing)).toEqual({ kind: "Written" });
  });

  it("lists and removes a folder", async () => {
    const folder = buildPath(root, "panel");
    await fileSystem.writeTextFile(buildPath(folder, "1.json"), "{}");

    expect(await fileSystem.listFileNames(folder)).toEqual({
      kind: "Listed",
      names: ["1.json"],
    });
    await fileSystem.removeDirectory(folder);
    expect(await fileSystem.listFileNames(folder)).toEqual({
      kind: "Listed",
      names: [],
    });
  });
});
