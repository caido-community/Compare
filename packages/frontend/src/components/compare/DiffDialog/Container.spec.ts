// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import PrimeVue from "primevue/config";
import { afterEach, describe, expect, it } from "vitest";

import DiffDialog from "./Container.vue";
import { type DiffView } from "./useForm";

import { compareTexts } from "@/core/diff";
import { buildItem } from "@/tests/fixtures";

const buildView = (original: string, modified: string): DiffView => ({
  original: buildItem(1, original),
  modified: buildItem(2, modified),
  result: compareTexts({
    original,
    modified,
    mode: "words",
    options: { ignoreWhitespace: false, ignoreCase: false },
  }),
});

afterEach(() => {
  document.body.innerHTML = "";
});

const mountDialog = async (view: DiffView) => {
  const errors: string[] = [];
  const wrapper = mount(DiffDialog, {
    props: { view },
    global: {
      plugins: [[PrimeVue, { unstyled: true }]],
      config: { errorHandler: (error) => errors.push(String(error)) },
    },
    attachTo: document.body,
  });
  await flushPromises();
  return { wrapper, errors };
};

const manyLines = (count: number, marker: string) =>
  Array.from({ length: count }, (_, index) => `${marker} line ${index}`).join(
    "\n",
  );

describe("opening a comparison", () => {
  it("renders the rows without an endless update loop", async () => {
    const { errors } = await mountDialog(buildView("a\nb\nc", "a\nx\nc"));

    expect(errors).toEqual([]);
    expect(document.body.textContent).toContain("x");
  });

  it("renders only a window of rows for a large comparison", async () => {
    const { errors } = await mountDialog(
      buildView(manyLines(5000, "a"), manyLines(5000, "b")),
    );

    const rendered = document.body.querySelectorAll("[data-row]").length;
    expect(errors).toEqual([]);
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(5000);
  });

  it("switches line wrapping off without an update loop", async () => {
    const { errors } = await mountDialog(buildView("a\nb", "a\nc"));
    const wrap = document.body.querySelector<HTMLInputElement>(
      "input[type=checkbox]",
    );

    wrap?.click();
    await flushPromises();

    expect(errors).toEqual([]);
  });
});
