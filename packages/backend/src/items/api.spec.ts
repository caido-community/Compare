import {
  err,
  ITEM_TOO_LARGE_MESSAGE,
  MAX_ITEM_BYTES,
  MAX_REQUESTS_PER_ADD,
  ok,
  type Panel,
} from "shared";
import { describe, expect, it } from "vitest";

import { FIXED_TIME, TEST_ROOT } from "../tests/fixtures";
import { buildMemoryFileSystem } from "../tests/memoryFileSystem";

import { buildItemsApi, type RequestReader } from "./api";
import { migrateStorage } from "./migrations";
import { buildProjectState } from "./project";
import { buildItemStore } from "./store";

const REQUESTS: Record<string, { source: string; data: string }> = {
  "1": { source: "https://example.com/a", data: "GET /a HTTP/1.1" },
  "2": { source: "https://example.com/b", data: "GET /b HTTP/1.1" },
};

const readRequest: RequestReader = (requestId) => {
  const request = REQUESTS[requestId];
  return Promise.resolve(
    request === undefined
      ? err(`Request ${requestId} is missing.`)
      : ok(request),
  );
};

const setup = async (options = { isProjectOpen: true }) => {
  const fileSystem = buildMemoryFileSystem();
  const store = buildItemStore(fileSystem, TEST_ROOT);
  const changes = { count: 0 };
  const now = () => FIXED_TIME;
  const project = buildProjectState({
    store,
    migrate: (id) =>
      migrateStorage({
        fileSystem,
        store,
        root: TEST_ROOT,
        projectId: id,
        now,
      }),
    notifyChange: () => {
      changes.count += 1;
    },
  });
  const api = buildItemsApi({
    project,
    store,
    fileSystem,
    readRequest,
    now,
  });
  if (options.isProjectOpen) await project.open("project-a");

  const listIds = async (panel: Panel) => {
    const listed = await api.listItems(panel);
    return listed.kind === "Ok" ? listed.value.map((item) => item.id) : [];
  };
  const addText = (panel: Panel, data: string) =>
    api.addItem({ panel, kind: "clipboard", source: "clipboard", data });

  return { fileSystem, project, api, changes, listIds, addText };
};

describe("adding items", () => {
  it("stores the item with the next id and the current time", async () => {
    const { api } = await setup();

    const added = await api.addItem({
      panel: "original",
      kind: "file",
      source: "notes.txt",
      data: "hello",
    });

    expect(added).toEqual(
      ok({
        id: 1,
        kind: "file",
        source: "notes.txt",
        data: "hello",
        createdAt: FIXED_TIME,
      }),
    );
  });

  it("numbers items across both panels", async () => {
    const { addText, listIds } = await setup();

    await addText("original", "one");
    await addText("modified", "two");
    await addText("original", "three");

    expect(await listIds("original")).toEqual([1, 3]);
    expect(await listIds("modified")).toEqual([2]);
  });

  it("rejects empty data", async () => {
    const { addText } = await setup();

    expect(await addText("original", "")).toEqual(err("The item is empty."));
  });

  it("refuses to add while no project is open", async () => {
    const { addText, listIds } = await setup({ isProjectOpen: false });

    expect(await addText("original", "data")).toEqual(
      err("Open a project to use Compare."),
    );
    expect(await listIds("original")).toEqual([]);
  });

  it("tells the frontend that items changed", async () => {
    const { addText, changes } = await setup();
    const before = changes.count;

    await addText("original", "data");

    expect(changes.count).toBe(before + 1);
  });
});

describe("adding uploaded files", () => {
  it("reads the uploaded file and stores its content", async () => {
    const { api, fileSystem } = await setup();
    fileSystem.files.set("/uploads/big.txt", "uploaded content");

    const added = await api.addFileItem({
      panel: "original",
      kind: "file",
      source: "big.txt",
      path: "/uploads/big.txt",
    });

    expect(added.kind === "Ok" && added.value.data).toBe("uploaded content");
  });

  it("reports an upload that no longer exists", async () => {
    const { api } = await setup();

    const added = await api.addFileItem({
      panel: "original",
      kind: "file",
      source: "gone.txt",
      path: "/uploads/gone.txt",
    });

    expect(added).toEqual(err("The uploaded file no longer exists."));
  });
});

describe("the size limit", () => {
  it("measures bytes, so multi-byte text hits the limit sooner", async () => {
    const { addText } = await setup();
    const twoByteCharacters = "é".repeat(MAX_ITEM_BYTES / 2 + 1);

    expect(await addText("original", twoByteCharacters)).toEqual(
      err(ITEM_TOO_LARGE_MESSAGE),
    );
  });
});

describe("adding requests from the history", () => {
  it("adds each request with its URL as the source", async () => {
    const { api } = await setup();

    const added = await api.addRequests({
      panel: "modified",
      requestIds: ["1", "2"],
    });

    expect(
      added.kind === "Ok" && added.value.map((item) => item.source),
    ).toEqual(["https://example.com/a", "https://example.com/b"]);
  });

  it("adds nothing when one request cannot be read", async () => {
    const { api, listIds } = await setup();

    const added = await api.addRequests({
      panel: "original",
      requestIds: ["1", "9"],
    });

    expect(added).toEqual(err("Request 9 is missing."));
    expect(await listIds("original")).toEqual([]);
  });

  it(`limits a batch to ${MAX_REQUESTS_PER_ADD} requests`, async () => {
    const { api } = await setup();
    const requestIds = Array.from(
      { length: MAX_REQUESTS_PER_ADD + 1 },
      () => "1",
    );

    const added = await api.addRequests({ panel: "original", requestIds });

    expect(added.kind).toBe("Error");
  });
});

describe("removing, moving, and clearing", () => {
  it("removes the selected items", async () => {
    const { api, addText, listIds } = await setup();
    await addText("original", "one");
    await addText("original", "two");

    await api.removeItems({ panel: "original", ids: [1] });

    expect(await listIds("original")).toEqual([2]);
  });

  it("moves items to the other panel and keeps their ids", async () => {
    const { api, addText, listIds, fileSystem } = await setup();
    await addText("original", "one");
    await addText("modified", "two");
    await addText("original", "three");

    await api.moveItems({ panel: "original", ids: [1, 3] });

    expect(await listIds("original")).toEqual([]);
    expect(await listIds("modified")).toEqual([1, 2, 3]);
    expect(
      fileSystem.files.has(`${TEST_ROOT}/projects/project-a/original/1.json`),
    ).toBe(false);
  });

  it("keeps an item in place when its move fails", async () => {
    const { api, addText, listIds, fileSystem } = await setup();
    await addText("original", "one");
    fileSystem.failing.add(`${TEST_ROOT}/projects/project-a/modified/1.json`);

    const moved = await api.moveItems({ panel: "original", ids: [1] });

    expect(moved.kind).toBe("Error");
    expect(await listIds("original")).toEqual([1]);
  });

  it("clears one panel only", async () => {
    const { api, addText, listIds } = await setup();
    await addText("original", "one");
    await addText("modified", "two");

    await api.clearPanel("original");

    expect(await listIds("original")).toEqual([]);
    expect(await listIds("modified")).toEqual([2]);
  });
});

describe("switching projects", () => {
  it("keeps each project's items separate", async () => {
    const { project, addText, listIds } = await setup();
    await addText("original", "in a");

    await project.open("project-b");
    expect(await listIds("original")).toEqual([]);

    await project.open("project-a");
    expect(await listIds("original")).toEqual([1]);
  });

  it("continues numbering after reopening a project", async () => {
    const { project, addText, listIds } = await setup();
    await addText("original", "one");

    await project.open("project-a");
    await addText("original", "two");

    expect(await listIds("original")).toEqual([1, 2]);
  });

  it("waits for a project to finish opening before listing", async () => {
    const { project, addText, listIds } = await setup();
    await addText("original", "one");
    await project.close();

    const opening = project.open("project-a");
    const listed = listIds("original");
    await opening;

    expect(await listed).toEqual([1]);
  });
});
