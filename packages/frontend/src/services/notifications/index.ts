import { type FrontendSDK, type NotificationSink } from "@/types";

export const buildNotificationSink = (sdk: FrontendSDK): NotificationSink => ({
  showSuccess: (message) =>
    sdk.window.showToast(message, { variant: "success" }),
  showError: (message) => sdk.window.showToast(message, { variant: "error" }),
});
