import { describe, expect, it } from "vitest";

import {
  buildItemPath,
  buildTestItem,
  FIXED_TIME,
  OTHER_PROJECT_ID,
  TEST_PROJECT_ID,
  TEST_ROOT,
} from "../../tests/fixtures";
import { buildTestStorage, listStoredIds } from "../../tests/storage";
import { CORRUPT_VERSION_MESSAGE } from "../messages";

const V1_TIME = "2025-01-01T00:00:00.000Z";

const VERSION_PATH = `${TEST_ROOT}/version.json`;

const buildV1Path = (directory: "panel1" | "panel2", id: number) =>
  `${TEST_ROOT}/${directory}/${id}.json`;

const buildV1Item = (id: number, data: string) =>
  JSON.stringify({
    id,
    length: data.length,
    data,
    preview: data,
    timestamp: V1_TIME,
    type: "request",
    source: "https://example.com:443",
    metadata: { method: "GET" },
  });

const setup = () => {
  const storage = buildTestStorage();
  const writeV1 = (directory: "panel1" | "panel2", id: number, data: string) =>
    storage.fileSystem.files.set(
      buildV1Path(directory, id),
      buildV1Item(id, data),
    );
  const listIds = (
    panel: "original" | "modified",
    projectId = TEST_PROJECT_ID,
  ) => listStoredIds(storage.store, projectId, panel);
  return { ...storage, writeV1, listIds };
};

describe("migrateStorage", () => {
  describe("from v1 (one shared set of panels for every project)", () => {
    it("copies panel1 into original and panel2 into modified", async () => {
      const { migrate, writeV1, listIds } = setup();
      writeV1("panel1", 1, "GET / HTTP/1.1");
      writeV1("panel1", 3, "GET /a HTTP/1.1");
      writeV1("panel2", 2, "GET /b HTTP/1.1");

      const result = await migrate(TEST_PROJECT_ID);

      expect(result).toEqual({
        kind: "Ok",
        value: { from: 1, to: 2, copiedItems: 3 },
      });
      expect(await listIds("original")).toEqual([1, 3]);
      expect(await listIds("modified")).toEqual([2]);
    });

    it("converts the v1 fields to the current item shape", async () => {
      const { store, migrate, writeV1 } = setup();
      writeV1("panel1", 1, "GET / HTTP/1.1");

      await migrate(TEST_PROJECT_ID);

      expect(await store.readPanel(TEST_PROJECT_ID, "original")).toEqual({
        kind: "Ok",
        value: [
          {
            id: 1,
            kind: "request",
            source: "https://example.com:443",
            data: "GET / HTTP/1.1",
            createdAt: V1_TIME,
          },
        ],
      });
    });

    it("keeps the v1 files as a backup", async () => {
      const { fileSystem, migrate, writeV1 } = setup();
      writeV1("panel1", 1, "data");

      await migrate(TEST_PROJECT_ID);

      expect(fileSystem.files.has(buildV1Path("panel1", 1))).toBe(true);
    });

    it("does not overwrite items an interrupted run already copied", async () => {
      const { store, migrate, writeV1, listIds } = setup();
      writeV1("panel1", 1, "from v1");
      writeV1("panel1", 2, "from v1 too");
      await store.writeItem(
        TEST_PROJECT_ID,
        "original",
        buildTestItem(1, "kept"),
      );

      const result = await migrate(TEST_PROJECT_ID);

      expect(result.kind === "Ok" && result.value.copiedItems).toBe(1);
      expect(await listIds("original")).toEqual([1, 2]);
      const read = await store.readPanel(TEST_PROJECT_ID, "original");
      expect(read.kind === "Ok" && read.value[0]?.data).toBe("kept");
    });

    it("skips a v1 file that is not valid JSON", async () => {
      const { fileSystem, migrate, writeV1, listIds } = setup();
      writeV1("panel1", 1, "good");
      fileSystem.files.set(buildV1Path("panel1", 2), "{not json");

      await migrate(TEST_PROJECT_ID);

      expect(await listIds("original")).toEqual([1]);
      expect(fileSystem.files.has(buildV1Path("panel1", 2))).toBe(true);
    });

    it("stays at v1 when a copy fails and finishes on the next run", async () => {
      const { fileSystem, migrate, writeV1, listIds } = setup();
      writeV1("panel1", 1, "data");
      fileSystem.failing.add(buildItemPath("original", 1));

      const failed = await migrate(TEST_PROJECT_ID);
      fileSystem.failing.clear();
      const retried = await migrate(TEST_PROJECT_ID);

      expect(failed.kind).toBe("Error");
      expect(retried).toEqual({
        kind: "Ok",
        value: { from: 1, to: 2, copiedItems: 1 },
      });
      expect(await listIds("original")).toEqual([1]);
    });

    it("upgrades a fresh install with no data", async () => {
      const { fileSystem, migrate } = setup();

      const result = await migrate(TEST_PROJECT_ID);

      expect(result).toEqual({
        kind: "Ok",
        value: { from: 1, to: 2, copiedItems: 0 },
      });
      expect(fileSystem.files.get(VERSION_PATH)).toContain('"version": 2');
    });

    it("uses the current time for v1 items without a timestamp", async () => {
      const { fileSystem, store, migrate } = setup();
      fileSystem.files.set(
        buildV1Path("panel1", 1),
        JSON.stringify({ id: 1, type: "file", data: "x" }),
      );

      await migrate(TEST_PROJECT_ID);

      const read = await store.readPanel(TEST_PROJECT_ID, "original");
      expect(read.kind === "Ok" && read.value[0]?.createdAt).toBe(FIXED_TIME);
    });
  });

  describe("at the current version", () => {
    it("does nothing, so other projects start empty", async () => {
      const { migrate, writeV1, listIds } = setup();
      writeV1("panel1", 1, "data");
      await migrate(TEST_PROJECT_ID);

      const result = await migrate(OTHER_PROJECT_ID);

      expect(result).toEqual({
        kind: "Ok",
        value: { from: 2, to: 2, copiedItems: 0 },
      });
      expect(await listIds("original", OTHER_PROJECT_ID)).toEqual([]);
    });
  });

  describe("with an unusable version file", () => {
    it("refuses data written by a newer version", async () => {
      const { fileSystem, migrate } = setup();
      fileSystem.files.set(VERSION_PATH, '{ "version": 9 }');

      expect((await migrate(TEST_PROJECT_ID)).kind).toBe("Error");
    });

    it("stops instead of re-running v1 when the file is corrupt", async () => {
      const { fileSystem, migrate, writeV1, listIds } = setup();
      writeV1("panel1", 1, "data");
      fileSystem.files.set(VERSION_PATH, '{ "version": "2" }');

      const result = await migrate(TEST_PROJECT_ID);

      expect(result).toEqual({ kind: "Error", error: CORRUPT_VERSION_MESSAGE });
      expect(await listIds("original")).toEqual([]);
    });
  });
});
