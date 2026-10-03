import { buildItemService, type ItemService } from "./items";
import { buildNotificationSink } from "./notifications";

import { type FrontendSDK, type NotificationSink } from "@/types";

export type Services = {
  items: ItemService;
  notifications: NotificationSink;
};

export const buildServices = (sdk: FrontendSDK): Services => ({
  items: buildItemService(sdk),
  notifications: buildNotificationSink(sdk),
});
