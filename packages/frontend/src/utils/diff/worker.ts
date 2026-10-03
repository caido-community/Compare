import { compareTexts, type DiffInput, type DiffResult } from "./index";

const scope: {
  addEventListener: Window["addEventListener"];
  postMessage: (message: DiffResult) => void;
} = globalThis;

scope.addEventListener("message", (event: MessageEvent<DiffInput>) => {
  scope.postMessage(compareTexts(event.data));
});
