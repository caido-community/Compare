import type { SDK } from "caido:plugin";
import type { Result, Spec } from "shared";

import { buildItemsApi } from "./items/api";
import { migrateStorage, type MigrationOutcome } from "./items/migrations";
import { buildProjectState } from "./items/project";
import { buildItemStore } from "./items/store";
import { buildFileSystem, buildPath } from "./runtime/fileSystem";
import { buildRequestReader } from "./runtime/requests";

const DATA_DIRECTORY = "compare-data";

const reportOpened = (sdk: SDK<Spec>, opened: Result<MigrationOutcome>) => {
  if (opened.kind === "Error") {
    sdk.console.error(
      `Compare: the project could not be opened. ${opened.error}`,
    );
    return;
  }

  const { from, to, copiedItems } = opened.value;
  if (from !== to) {
    sdk.console.log(
      `Compare: storage upgraded from v${from} to v${to}, ${copiedItems} item(s) copied into this project.`,
    );
  }
};

export function init(sdk: SDK<Spec>) {
  const fileSystem = buildFileSystem();
  const root = buildPath(sdk.meta.path(), DATA_DIRECTORY);
  const now = () => new Date().toISOString();
  const store = buildItemStore(fileSystem, root);

  const project = buildProjectState({
    store,
    migrate: (projectId) =>
      migrateStorage({ fileSystem, store, root, projectId, now }),
    notifyChange: () => sdk.api.send("itemsChanged"),
  });

  const items = buildItemsApi({
    project,
    store,
    fileSystem,
    readRequest: buildRequestReader(sdk),
    now,
  });

  sdk.api.register("listItems", (_sdk, panel) => items.listItems(panel));
  sdk.api.register("addItem", (_sdk, input) => items.addItem(input));
  sdk.api.register("addFileItem", (_sdk, input) => items.addFileItem(input));
  sdk.api.register("addRequests", (_sdk, input) => items.addRequests(input));
  sdk.api.register("removeItems", (_sdk, selection) =>
    items.removeItems(selection),
  );
  sdk.api.register("moveItems", (_sdk, selection) =>
    items.moveItems(selection),
  );
  sdk.api.register("clearPanel", (_sdk, panel) => items.clearPanel(panel));

  const switchProject = async (projectId: string | undefined) => {
    if (projectId === undefined) return project.close();
    reportOpened(sdk, await project.open(projectId));
  };

  void sdk.projects
    .getCurrent()
    .then((current) => switchProject(current?.getId()));

  sdk.events.onProjectChange((_sdk, current) =>
    switchProject(current?.getId()),
  );
}
