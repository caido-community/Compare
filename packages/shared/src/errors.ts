export const readErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
