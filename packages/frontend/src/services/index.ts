import { type DiffRun, runDiff } from "./diff";
import { buildItemService, type ItemService } from "./items";
import { buildNotificationSink } from "./notifications";

import { type DiffInput } from "@/core/diff";
import { type FrontendSDK, type NotificationSink } from "@/types";

export type Services = {
  items: ItemService;
  notifications: NotificationSink;
  runDiff: (input: DiffInput) => DiffRun;
};

export const buildServices = (sdk: FrontendSDK): Services => ({
  items: buildItemService(sdk),
  notifications: buildNotificationSink(sdk),
  runDiff,
});
