import { type HostedFile } from "@caido/sdk-frontend";
import { err, ok } from "shared";
import { describe, expect, it } from "vitest";

import { type FileHost, withUploadedFile } from "./index";

const hostedFile = (status: HostedFile["status"]): HostedFile => ({
  id: "file-1",
  name: "big.txt",
  size: 3,
  status,
  path: "/uploads/big.txt",
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

const buildHost = (outcome: () => Promise<HostedFile>) => {
  const deleted: string[] = [];
  const host: FileHost = {
    create: outcome,
    delete: (id) => {
      deleted.push(id);
      return Promise.resolve();
    },
  };
  return { host, deleted };
};

const file = new File(["abc"], "big.txt");

describe("withUploadedFile", () => {
  it("passes the uploaded path on and deletes the file afterwards", async () => {
    const { host, deleted } = buildHost(() =>
      Promise.resolve(hostedFile("ready")),
    );

    const result = await withUploadedFile(host, file, (path) =>
      Promise.resolve(ok(path)),
    );

    expect(result).toEqual(ok("/uploads/big.txt"));
    expect(deleted).toEqual(["file-1"]);
  });

  it("still deletes the file when using it fails", async () => {
    const { host, deleted } = buildHost(() =>
      Promise.resolve(hostedFile("ready")),
    );

    const result = await withUploadedFile(host, file, () =>
      Promise.resolve(err("backend refused")),
    );

    expect(result).toEqual(err("backend refused"));
    expect(deleted).toEqual(["file-1"]);
  });

  it("reports a file Caido could not store", async () => {
    const { host } = buildHost(() => Promise.resolve(hostedFile("error")));

    const result = await withUploadedFile(host, file, (path) =>
      Promise.resolve(ok(path)),
    );

    expect(result).toEqual(err("Caido could not store the uploaded file."));
  });

  it("reports a failed upload", async () => {
    const { host } = buildHost(() => Promise.reject(new Error("413")));

    const result = await withUploadedFile(host, file, (path) =>
      Promise.resolve(ok(path)),
    );

    expect(result).toEqual(err("The file could not be uploaded. 413"));
  });
});
