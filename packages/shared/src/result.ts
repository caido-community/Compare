export type Result<T> =
  | { kind: "Ok"; value: T }
  | { kind: "Error"; error: string };

export const ok = <T>(value: T): Result<T> => ({ kind: "Ok", value });

export const err = <T>(error: string): Result<T> => ({ kind: "Error", error });
