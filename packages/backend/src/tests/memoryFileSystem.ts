import { measureBytes } from "shared";

import { type FileSystem } from "../runtime/fileSystem";

export type MemoryFileSystem = FileSystem & {
  files: Map<string, string>;
  failing: Set<string>;
};

const FAILED = { kind: "Failed" as const, message: "permission denied" };

const WRITTEN = { kind: "Written" as const };

const listChildren = (files: Map<string, string>, directory: string) => {
  const prefix = `${directory}/`;
  return [...files.keys()]
    .filter((path) => path.startsWith(prefix))
    .map((path) => path.slice(prefix.length))
    .filter((name) => !name.includes("/"));
};

export const buildMemoryFileSystem = (): MemoryFileSystem => {
  const files = new Map<string, string>();
  const failing = new Set<string>();

  return {
    files,
    failing,

    readTextFile: (path) => {
      if (failing.has(path)) return Promise.resolve(FAILED);
      const content = files.get(path);
      return Promise.resolve(
        content === undefined
          ? { kind: "Missing" as const }
          : { kind: "Found" as const, content },
      );
    },

    readFileSize: (path) => {
      if (failing.has(path)) return Promise.resolve(FAILED);
      const content = files.get(path);
      return Promise.resolve(
        content === undefined
          ? { kind: "Missing" as const }
          : { kind: "Found" as const, bytes: measureBytes(content) },
      );
    },

    writeTextFile: (path, content) => {
      if (failing.has(path)) return Promise.resolve(FAILED);
      files.set(path, content);
      return Promise.resolve(WRITTEN);
    },

    removeFile: (path) => {
      if (failing.has(path)) return Promise.resolve(FAILED);
      files.delete(path);
      return Promise.resolve(WRITTEN);
    },

    removeDirectory: (path) => {
      if (failing.has(path)) return Promise.resolve(FAILED);
      for (const file of [...files.keys()]) {
        if (file.startsWith(`${path}/`)) files.delete(file);
      }
      return Promise.resolve(WRITTEN);
    },

    listFileNames: (path) =>
      Promise.resolve(
        failing.has(path)
          ? FAILED
          : { kind: "Listed" as const, names: listChildren(files, path) },
      ),
  };
};
