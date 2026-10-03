// @vitest-environment happy-dom
import { type CompareItem, err, ok } from "shared";
import { describe, expect, it } from "vitest";

import { usePanel } from "./usePanel";

import { type ItemService } from "@/services/items";
import { buildItem, buildItemServiceDouble } from "@/tests/fixtures";
import { mountComposable } from "@/tests/mountComposable";

const buildServiceDouble = (stored: CompareItem[], failWith?: string) => {
  const calls: string[] = [];
  const service = buildItemServiceDouble({
    listItems: () => Promise.resolve(ok(stored)),
    removeItems: (selection) => {
      calls.push(`remove ${selection.ids.join(",")}`);
      return Promise.resolve(
        failWith === undefined ? ok(selection.ids) : err<number[]>(failWith),
      );
    },
    moveItems: (selection) => {
      calls.push(`move ${selection.ids.join(",")}`);
      return Promise.resolve(ok([]));
    },
  });
  return { service, calls };
};

const mountPanel = (service: ItemService) => {
  const errors: string[] = [];
  const notifications = {
    showSuccess: () => undefined,
    showError: (message: string) => errors.push(message),
  };
  return mountComposable(() =>
    usePanel("original", { items: service, notifications }),
  ).then((panel) => ({ panel, errors }));
};

describe("loading a panel", () => {
  it("keeps only the selected items that still exist", async () => {
    const { service } = buildServiceDouble([buildItem(1), buildItem(2)]);
    const { panel } = await mountPanel(service);
    panel.select([buildItem(1), buildItem(3)]);

    await panel.load();

    expect(panel.items.value.map((entry) => entry.id)).toEqual([1, 2]);
    expect(panel.selected.value.map((entry) => entry.id)).toEqual([1]);
  });
});

describe("removing and moving", () => {
  it("removes the selected items", async () => {
    const { service, calls } = buildServiceDouble([buildItem(1), buildItem(2)]);
    const { panel } = await mountPanel(service);
    panel.select([buildItem(1), buildItem(2)]);

    await panel.removeSelected();

    expect(calls).toEqual(["remove 1,2"]);
  });

  it("reports why a removal failed", async () => {
    const { service } = buildServiceDouble([buildItem(1)], "disk full");
    const { panel, errors } = await mountPanel(service);
    panel.select([buildItem(1)]);

    await panel.removeSelected();

    expect(errors).toEqual(["Unable to remove from Original: disk full"]);
  });

  it("moves exactly the items it is given", async () => {
    const { service, calls } = buildServiceDouble([buildItem(1), buildItem(2)]);
    const { panel } = await mountPanel(service);

    await panel.moveToOtherPanel([buildItem(2)]);

    expect(calls).toEqual(["move 2"]);
  });
});
