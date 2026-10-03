// @vitest-environment happy-dom
import { err, ok, type Result } from "shared";
import { describe, expect, it } from "vitest";

import { useForm } from "./useForm";

import { type DiffInput, type DiffResult } from "@/core/diff";
import { type Services } from "@/services";
import { type DiffRun } from "@/services/diff";
import { buildItem } from "@/tests/fixtures";
import { mountComposable } from "@/tests/mountComposable";

const RESULT: DiffResult = {
  mode: "words",
  rows: [],
  summary: { added: 0, deleted: 0, modified: 0, unchanged: 0 },
  isAlignmentComplete: true,
  isHighlightingComplete: true,
};

const buildServices = () => {
  const inputs: DiffInput[] = [];
  const errors: string[] = [];
  const pending: Array<(outcome: Result<DiffResult>) => void> = [];
  const cancelled = { count: 0 };

  const runDiff = (input: DiffInput): DiffRun => {
    inputs.push(input);
    return {
      result: new Promise((resolve) => pending.push(resolve)),
      cancel: () => {
        cancelled.count += 1;
      },
    };
  };

  const services: Services = {
    items: {
      listItems: (panel) =>
        Promise.resolve(ok([buildItem(panel === "original" ? 1 : 2, panel)])),
      addItem: () => Promise.resolve(ok(buildItem(9, ""))),
      addRequests: () => Promise.resolve(ok([])),
      removeItems: () => Promise.resolve(ok([])),
      moveItems: () => Promise.resolve(ok([])),
      clearPanel: (panel) => Promise.resolve(ok(panel)),
      onItemsChanged: () => () => undefined,
    },
    notifications: {
      showSuccess: () => undefined,
      showError: (message) => errors.push(message),
    },
    runDiff,
  };

  const finish = (outcome: Result<DiffResult>) => pending.shift()?.(outcome);
  return { services, inputs, errors, cancelled, finish };
};

const mountReadyForm = async () => {
  const doubles = buildServices();
  const form = await mountComposable(() => useForm(doubles.services));
  form.original.select([buildItem(1, "left")]);
  form.modified.select([buildItem(2, "right")]);
  return { form, ...doubles };
};

describe("comparing the selected items", () => {
  it("sends both texts and a plain copy of the options", async () => {
    const { form, inputs } = await mountReadyForm();
    form.diffOptions.value.ignoreCase = true;

    void form.compare("bytes");

    expect(inputs).toEqual([
      {
        original: "left",
        modified: "right",
        mode: "bytes",
        options: { ignoreWhitespace: false, ignoreCase: true },
      },
    ]);
  });

  it("blocks another comparison while one is running", async () => {
    const { form } = await mountReadyForm();

    void form.compare("words");

    expect(form.isComparing.value).toBe(true);
    expect(form.canCompare.value).toBe(false);
  });

  it("opens the result when the comparison finishes", async () => {
    const { form, finish } = await mountReadyForm();

    const comparing = form.compare("words");
    finish(ok(RESULT));
    await comparing;

    expect(form.isComparing.value).toBe(false);
    expect(form.diffView.value?.result).toEqual(RESULT);
  });

  it("reports a failed comparison", async () => {
    const { form, finish, errors } = await mountReadyForm();

    const comparing = form.compare("words");
    finish(err("worker crashed"));
    await comparing;

    expect(form.diffView.value).toBeUndefined();
    expect(errors).toEqual(["Unable to compare: worker crashed"]);
  });
});

describe("cancelling", () => {
  it("stops the worker and ignores its late answer", async () => {
    const { form, finish, cancelled, errors } = await mountReadyForm();

    const comparing = form.compare("words");
    form.cancelCompare();
    finish(ok(RESULT));
    await comparing;

    expect(cancelled.count).toBe(1);
    expect(form.isComparing.value).toBe(false);
    expect(form.diffView.value).toBeUndefined();
    expect(errors).toEqual([]);
  });
});
