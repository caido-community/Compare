export type NotificationSink = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};
