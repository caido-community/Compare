import { type HostedFile } from "@caido/sdk-frontend";
import { err, ok, readErrorMessage, type Result } from "shared";

import { type FrontendSDK } from "@/types";

export type FileHost = Pick<FrontendSDK["files"], "create" | "delete">;

const uploadFile = (host: FileHost, file: File): Promise<Result<HostedFile>> =>
  host.create(file).then(
    (hosted) =>
      hosted.status === "ready"
        ? ok(hosted)
        : err<HostedFile>("Caido could not store the uploaded file."),
    (error: unknown) =>
      err<HostedFile>(
        `The file could not be uploaded. ${readErrorMessage(error)}`,
      ),
  );

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
