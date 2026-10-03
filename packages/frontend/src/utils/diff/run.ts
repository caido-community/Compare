import { err, ok, type Result } from "shared";

import DiffWorker from "./worker?worker&inline";

import { type DiffInput, type DiffResult } from "./index";

export type DiffRun = {
  result: Promise<Result<DiffResult>>;
  cancel: () => void;
};

export const runDiff = (input: DiffInput): DiffRun => {
  const worker = new DiffWorker();
  const { promise, resolve } = Promise.withResolvers<Result<DiffResult>>();

  const finish = (outcome: Result<DiffResult>) => {
    worker.terminate();
    resolve(outcome);
  };

  worker.onmessage = (event: MessageEvent<DiffResult>) =>
    finish(ok(event.data));
  worker.onerror = (event) =>
    finish(
      err(event.message === "" ? "The comparison failed." : event.message),
    );
  worker.postMessage(input);

  return {
    result: promise,
    cancel: () => finish(err("The comparison was cancelled.")),
  };
};
