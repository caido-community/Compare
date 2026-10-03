import type { SDK } from "caido:plugin";
import type { Result, Spec } from "shared";

import { buildItemsApi } from "./items/api";
import { buildMigrator } from "./items/migrations";
import { type MigrationOutcome } from "./items/migrations/types";
import { buildItemState } from "./items/state";
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

  const state = buildItemState({
    store,
    migrate: buildMigrator({ fileSystem, store, root, now }),
    now,
    notifyChange: () => sdk.api.send("itemsChanged"),
  });

  const items = buildItemsApi({
    state,
    fileSystem,
    readRequest: buildRequestReader(sdk),
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
    if (projectId === undefined) {
      await state.close();
      return;
    }
    reportOpened(sdk, await state.open(projectId));
  };

  let hasProjectChanged = false;

  void sdk.projects.getCurrent().then((current) => {
    if (!hasProjectChanged) void switchProject(current?.getId());
  });

  sdk.events.onProjectChange((_sdk, current) => {
    hasProjectChanged = true;
    return switchProject(current?.getId());
  });
}
