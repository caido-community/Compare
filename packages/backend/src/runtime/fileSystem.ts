import {
  access,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "fs/promises";
import { dirname, join } from "path";

import { readErrorMessage } from "shared";

type ReadOutcome =
  | { kind: "Found"; content: string }
  | { kind: "Missing" }
  | { kind: "Failed"; message: string };

type WriteOutcome = { kind: "Written" } | { kind: "Failed"; message: string };

type SizeOutcome =
  | { kind: "Found"; bytes: number }
  | { kind: "Missing" }
  | { kind: "Failed"; message: string };

type ListOutcome =
  | { kind: "Listed"; names: string[] }
  | { kind: "Failed"; message: string };

export type FileSystem = {
  readTextFile: (path: string) => Promise<ReadOutcome>;
  readFileSize: (path: string) => Promise<SizeOutcome>;
  writeTextFile: (path: string, content: string) => Promise<WriteOutcome>;
  removeFile: (path: string) => Promise<WriteOutcome>;
  removeDirectory: (path: string) => Promise<WriteOutcome>;
  listFileNames: (path: string) => Promise<ListOutcome>;
};

const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

let stagingCounter = 0;

export const buildFileSystem = (): FileSystem => ({
  readTextFile: async (path) => {
    try {
      return { kind: "Found", content: await readFile(path, "utf8") };
    } catch (error) {
      return (await exists(path))
        ? { kind: "Failed", message: readErrorMessage(error) }
        : { kind: "Missing" };
    }
  },

  readFileSize: async (path) => {
    try {
      return { kind: "Found", bytes: (await stat(path)).size };
    } catch (error) {
      return (await exists(path))
        ? { kind: "Failed", message: readErrorMessage(error) }
        : { kind: "Missing" };
    }
  },

  writeTextFile: async (path, content) => {
    stagingCounter += 1;
    const staged = `${path}.${stagingCounter}.staging`;

    try {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(staged, content);
      await rename(staged, path);
      return { kind: "Written" };
    } catch (error) {
      await rm(staged).catch(() => undefined);
      return { kind: "Failed", message: readErrorMessage(error) };
    }
  },

  removeFile: async (path) => {
    try {
      await rm(path, { force: true });
      return { kind: "Written" };
    } catch (error) {
      return { kind: "Failed", message: readErrorMessage(error) };
    }
  },

  removeDirectory: async (path) => {
    try {
      await rm(path, { recursive: true, force: true });
      return { kind: "Written" };
    } catch (error) {
      return { kind: "Failed", message: readErrorMessage(error) };
    }
  },

  listFileNames: async (path) => {
    try {
      const entries = await readdir(path);
      return { kind: "Listed", names: entries.map((entry) => String(entry)) };
    } catch (error) {
      return (await exists(path))
        ? { kind: "Failed", message: readErrorMessage(error) }
        : { kind: "Listed", names: [] };
    }
  },
});

export const buildPath = join;
