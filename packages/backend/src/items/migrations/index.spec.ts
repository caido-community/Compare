import { describe, expect, it } from "vitest";

import { FIXED_TIME, TEST_ROOT } from "../../tests/fixtures";
import { buildMemoryFileSystem } from "../../tests/memoryFileSystem";
import { buildItemStore } from "../store";

import { migrateStorage } from "./index";

const v1Item = (id: number, data: string) =>
  JSON.stringify({
    id,
    length: data.length,
    data,
    preview: data,
    timestamp: "2025-01-01T00:00:00.000Z",
    type: "request",
    source: "https://example.com:443",
    metadata: { method: "GET" },
  });

const setup = () => {
  const fileSystem = buildMemoryFileSystem();
  const store = buildItemStore(fileSystem, TEST_ROOT);
  const migrate = (projectId: string) =>
    migrateStorage({
      fileSystem,
      store,
      root: TEST_ROOT,
      projectId,
      now: () => FIXED_TIME,
    });
  const readIds = async (projectId: string, panel: "original" | "modified") => {
    const read = await store.readPanel(projectId, panel);
    return read.kind === "Ok" ? read.value.map((item) => item.id) : [];
  };
  return { fileSystem, store, migrate, readIds };
};

describe("migrateStorage", () => {
  describe("from v1 (one shared set of panels for every project)", () => {
    it("copies panel1 into original and panel2 into modified", async () => {
      const { fileSystem, migrate, readIds } = setup();
      fileSystem.files.set(
        `${TEST_ROOT}/panel1/1.json`,
        v1Item(1, "GET / HTTP/1.1"),
      );
      fileSystem.files.set(
        `${TEST_ROOT}/panel1/3.json`,
        v1Item(3, "GET /a HTTP/1.1"),
      );
      fileSystem.files.set(
        `${TEST_ROOT}/panel2/2.json`,
        v1Item(2, "GET /b HTTP/1.1"),
      );

      const result = await migrate("project-a");

      expect(result).toEqual({
        kind: "Ok",
        value: { from: 1, to: 2, copiedItems: 3 },
      });
      expect(await readIds("project-a", "original")).toEqual([1, 3]);
      expect(await readIds("project-a", "modified")).toEqual([2]);
    });

    it("converts the v1 fields to the current item shape", async () => {
      const { fileSystem, store, migrate } = setup();
      fileSystem.files.set(
        `${TEST_ROOT}/panel1/1.json`,
        v1Item(1, "GET / HTTP/1.1"),
      );

      await migrate("project-a");

      expect(await store.readPanel("project-a", "original")).toEqual({
        kind: "Ok",
        value: [
          {
            id: 1,
            kind: "request",
            source: "https://example.com:443",
            data: "GET / HTTP/1.1",
            createdAt: "2025-01-01T00:00:00.000Z",
          },
        ],
      });
    });

    it("keeps the v1 files as a backup", async () => {
      const { fileSystem, migrate } = setup();
      fileSystem.files.set(`${TEST_ROOT}/panel1/1.json`, v1Item(1, "data"));

      await migrate("project-a");

      expect(fileSystem.files.has(`${TEST_ROOT}/panel1/1.json`)).toBe(true);
    });

    it("does not overwrite items an interrupted run already copied", async () => {
      const { fileSystem, store, migrate, readIds } = setup();
      fileSystem.files.set(`${TEST_ROOT}/panel1/1.json`, v1Item(1, "from v1"));
      fileSystem.files.set(
        `${TEST_ROOT}/panel1/2.json`,
        v1Item(2, "from v1 too"),
      );
      await store.writeItem("project-a", "original", {
        id: 1,
        kind: "clipboard",
        source: "clipboard",
        data: "kept",
        createdAt: FIXED_TIME,
      });

      const result = await migrate("project-a");

      expect(result.kind === "Ok" && result.value.copiedItems).toBe(1);
      expect(await readIds("project-a", "original")).toEqual([1, 2]);
      const read = await store.readPanel("project-a", "original");
      expect(read.kind === "Ok" && read.value[0]?.data).toBe("kept");
    });

    it("skips a v1 file that is not valid JSON", async () => {
      const { fileSystem, migrate, readIds } = setup();
      fileSystem.files.set(`${TEST_ROOT}/panel1/1.json`, v1Item(1, "good"));
      fileSystem.files.set(`${TEST_ROOT}/panel1/2.json`, "{not json");

      await migrate("project-a");

      expect(await readIds("project-a", "original")).toEqual([1]);
      expect(fileSystem.files.has(`${TEST_ROOT}/panel1/2.json`)).toBe(true);
    });

    it("stays at v1 and retries when a copy fails", async () => {
      const { fileSystem, migrate } = setup();
      fileSystem.files.set(`${TEST_ROOT}/panel1/1.json`, v1Item(1, "data"));
      fileSystem.failing.add(`${TEST_ROOT}/projects/project-a/original/1.json`);

      const result = await migrate("project-a");

      expect(result.kind).toBe("Error");
      expect(fileSystem.files.has(`${TEST_ROOT}/version.json`)).toBe(false);
    });

    it("upgrades a fresh install with no data", async () => {
      const { fileSystem, migrate } = setup();

      const result = await migrate("project-a");

      expect(result).toEqual({
        kind: "Ok",
        value: { from: 1, to: 2, copiedItems: 0 },
      });
      expect(fileSystem.files.get(`${TEST_ROOT}/version.json`)).toContain(
        '"version": 2',
      );
    });
  });

  describe("at the current version", () => {
    it("does nothing, so other projects start empty", async () => {
      const { fileSystem, migrate, readIds } = setup();
      fileSystem.files.set(`${TEST_ROOT}/panel1/1.json`, v1Item(1, "data"));
      await migrate("project-a");

      const result = await migrate("project-b");

      expect(result).toEqual({
        kind: "Ok",
        value: { from: 2, to: 2, copiedItems: 0 },
      });
      expect(await readIds("project-b", "original")).toEqual([]);
    });
  });

  describe("from a newer version", () => {
    it("refuses to touch the data", async () => {
      const { fileSystem, migrate } = setup();
      fileSystem.files.set(`${TEST_ROOT}/version.json`, '{ "version": 9 }');

      const result = await migrate("project-a");

      expect(result.kind).toBe("Error");
    });
  });
});
