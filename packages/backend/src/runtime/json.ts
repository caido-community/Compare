import { err, ok, type Result } from "shared";

import { buildPath, type FileSystem } from "./fileSystem";

type JsonOutcome =
  | { kind: "Found"; value: unknown }
  | { kind: "Missing" }
  | { kind: "Invalid" };

const parseJson = (content: string): JsonOutcome => {
  try {
    return { kind: "Found", value: JSON.parse(content) };
  } catch {
    return { kind: "Invalid" };
  }
};

export const formatJson = (value: unknown): string =>
  `${JSON.stringify(value, undefined, 2)}\n`;

export const readJsonFile = async (
  fileSystem: FileSystem,
  path: string,
): Promise<Result<JsonOutcome>> => {
  const read = await fileSystem.readTextFile(path);
  if (read.kind === "Failed") return err(read.message);
  if (read.kind === "Missing") return ok({ kind: "Missing" });
  return ok(parseJson(read.content));
};

export const readJsonDirectory = async (
  fileSystem: FileSystem,
  directory: string,
): Promise<Result<unknown[]>> => {
  const listed = await fileSystem.listFileNames(directory);
  if (listed.kind === "Failed") return err(listed.message);

  const files = listed.names.filter((name) => name.endsWith(".json"));
  const values: unknown[] = [];
  for (const file of files) {
    const read = await readJsonFile(fileSystem, buildPath(directory, file));
    if (read.kind === "Error") return read;
    if (read.value.kind === "Found") values.push(read.value.value);
  }

  return ok(values);
};
