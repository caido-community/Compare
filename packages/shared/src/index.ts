import type { DefinePluginPackageSpec } from "@caido/sdk-shared";

import type { API } from "./api";
import type { Events } from "./events";

export type Spec = DefinePluginPackageSpec<{
  manifestId: "compare";
  api: API;
  events: Events;
}>;

export type { API } from "./api";
export type { Events } from "./events";
export { readErrorMessage } from "./errors";
export {
  type AddItemInput,
  type AddRequestsInput,
  type CompareItem,
  getOtherPanel,
  type ItemKind,
  type ItemSelection,
  type Panel,
  PANELS,
} from "./items";
export { err, ok, type Result } from "./result";
