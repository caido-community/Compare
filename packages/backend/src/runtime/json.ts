import { err, ok, type Result } from "shared";

import { buildPath, type FileSystem } from "./fileSystem";

const parseJson = (content: string): unknown => {
  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
};

export const formatJson = (value: unknown): string =>
  `${JSON.stringify(value, undefined, 2)}\n`;

export const readJsonFile = async (
  fileSystem: FileSystem,
  path: string,
): Promise<Result<unknown>> => {
  const read = await fileSystem.readTextFile(path);
  if (read.kind === "Failed") return err(read.message);
  return ok(read.kind === "Found" ? parseJson(read.content) : undefined);
};

export const readJsonDirectory = async (
  fileSystem: FileSystem,
  directory: string,
): Promise<Result<unknown[]>> => {
  const listed = await fileSystem.listFileNames(directory);
  if (listed.kind === "Failed") return err(listed.message);

  const files = listed.names.filter((name) => name.endsWith(".json"));
  const contents: unknown[] = [];
  for (const file of files) {
    const read = await readJsonFile(fileSystem, buildPath(directory, file));
    if (read.kind === "Error") return read;
    contents.push(read.value);
  }

  return ok(contents);
};
