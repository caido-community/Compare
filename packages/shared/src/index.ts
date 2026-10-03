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
  type AddFileItemInput,
  type AddItemInput,
  type AddRequestsInput,
  type CompareItem,
  getOtherPanel,
  ITEM_KINDS,
  ITEM_TOO_LARGE_MESSAGE,
  type ItemKind,
  type ItemSelection,
  mapPanels,
  MAX_ITEM_BYTES,
  MAX_ITEM_MEGABYTES,
  MAX_REQUESTS_PER_ADD,
  type Panel,
  PANELS,
} from "./items";
export { err, ok, type Result } from "./result";
export { measureBytes } from "./text";
