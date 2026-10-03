import { err, readErrorMessage, type Result } from "shared";

export const callBackend = async <T>(
  run: () => Promise<Result<T>>,
): Promise<Result<T>> => {
  try {
    return await run();
  } catch (error) {
    return err(`The backend did not answer. ${readErrorMessage(error)}`);
  }
};
