import { err, ok, type Result } from "shared";

export type Applied<T> = { done: T[]; error: string | undefined };

export const applyInOrder = async <T>(
  entries: T[],
  apply: (entry: T) => Promise<Result<unknown>>,
): Promise<Applied<T>> => {
  const done: T[] = [];
  for (const entry of entries) {
    const result = await apply(entry);
    if (result.kind === "Error") return { done, error: result.error };
    done.push(entry);
  }
  return { done, error: undefined };
};

export const toResult = <T>(applied: Applied<T>): Result<T[]> =>
  applied.error === undefined ? ok(applied.done) : err(applied.error);

export const mapInOrder = async <T, U>(
  entries: T[],
  map: (entry: T) => Promise<Result<U>>,
): Promise<Result<U[]>> => {
  const values: U[] = [];
  for (const entry of entries) {
    const result = await map(entry);
    if (result.kind === "Error") return result;
    values.push(result.value);
  }
  return ok(values);
};
