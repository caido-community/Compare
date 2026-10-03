// @vitest-environment happy-dom
import { type CompareItem, err, ok } from "shared";
import { describe, expect, it } from "vitest";
import { ref } from "vue";

import { useForm } from "./useForm";

import { PANEL_ACTIONS } from "@/presentation/panels";
import {
  buildItem,
  buildItemServiceDouble,
  buildNotificationDouble,
} from "@/tests/fixtures";
import { mountComposable } from "@/tests/mountComposable";

const setup = async (stored: CompareItem[], removeFailure?: string) => {
  const calls: string[] = [];
  const changed = { notify: () => undefined };
  const items = buildItemServiceDouble({
    listItems: () => Promise.resolve(ok(stored)),
    removeItems: (selection) => {
      calls.push(`remove ${selection.ids.join(",")}`);
      return Promise.resolve(
        removeFailure === undefined
          ? ok(selection.ids)
          : err<number[]>(removeFailure),
      );
    },
    moveItems: (selection) => {
      calls.push(`move ${selection.ids.join(",")}`);
      return Promise.resolve(ok([]));
    },
    onItemsChanged: (listener) => {
      changed.notify = () => {
        listener();
        return undefined;
      };
      return () => undefined;
    },
  });
  const { notifications, errors } = buildNotificationDouble();
  const selected = ref<CompareItem[]>([]);
  const form = await mountComposable(() =>
    useForm({
      panel: "original",
      services: { items, notifications },
      selected,
    }),
  );
  const runAction = (label: string) =>
    form.toolbar.value.find((action) => action.label === label)?.run();
  return { form, selected, calls, errors, changed, runAction };
};

describe("loading a panel", () => {
  it("lists the stored items when mounted", async () => {
    const { form } = await setup([buildItem(1), buildItem(2)]);

    expect(form.items.value.map((item) => item.id)).toEqual([1, 2]);
  });

  it("drops selected items that no longer exist after a change", async () => {
    const { selected, changed } = await setup([buildItem(1), buildItem(2)]);
    selected.value = [buildItem(1), buildItem(3)];

    changed.notify();
    await Promise.resolve();
    await Promise.resolve();

    expect(selected.value.map((item) => item.id)).toEqual([1]);
  });
});

describe("removing and moving", () => {
  it("removes the selected items", async () => {
    const { selected, calls, runAction } = await setup([buildItem(1)]);
    selected.value = [buildItem(1), buildItem(2)];

    runAction(PANEL_ACTIONS.remove.label);
    await Promise.resolve();

    expect(calls).toEqual(["remove 1,2"]);
  });

  it("reports why a removal failed", async () => {
    const { selected, errors, runAction } = await setup(
      [buildItem(1)],
      "disk full",
    );
    selected.value = [buildItem(1)];

    runAction(PANEL_ACTIONS.remove.label);
    await Promise.resolve();
    await Promise.resolve();

    expect(errors).toEqual(["Unable to remove from Original: disk full"]);
  });

  it("disables removing while nothing is selected", async () => {
    const { form } = await setup([buildItem(1)]);

    const remove = form.toolbar.value.find(
      (action) => action.label === PANEL_ACTIONS.remove.label,
    );

    expect(remove?.isDisabled).toBe(true);
  });
});
