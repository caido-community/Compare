import { type HostedFile } from "@caido/sdk-frontend";
import { err, MAX_ITEM_BYTES, ok, readErrorMessage, type Result } from "shared";

import { type FrontendSDK } from "@/types";

export type FileHost = Pick<FrontendSDK["files"], "create" | "delete">;

export type Transport = "Inline" | "Upload" | "TooLarge";

export const INLINE_LIMIT_BYTES = 256 * 1024;

export const chooseTransport = (bytes: number): Transport => {
  if (bytes > MAX_ITEM_BYTES) return "TooLarge";
  return bytes <= INLINE_LIMIT_BYTES ? "Inline" : "Upload";
};

const uploadFile = async (
  host: FileHost,
  file: File,
): Promise<Result<HostedFile>> => {
  try {
    const hosted = await host.create(file);
    if (hosted.status !== "ready") {
      return err("Caido could not store the uploaded file.");
    }
    return ok(hosted);
  } catch (error) {
    return err(`The file could not be uploaded. ${readErrorMessage(error)}`);
  }
};

export const withUploadedFile = async <T>(
  host: FileHost,
  file: File,
  use: (path: string) => Promise<Result<T>>,
): Promise<Result<T>> => {
  const uploaded = await uploadFile(host, file);
  if (uploaded.kind === "Error") return uploaded;

  const result = await use(uploaded.value.path);
  await host.delete(uploaded.value.id).catch(() => undefined);
  return result;
};
