import { defineStore } from "pinia";
import {
  type AddFileItemInput,
  type AddItemInput,
  type CompareItem,
  err,
  getOtherPanel,
  ITEM_TOO_LARGE_MESSAGE,
  mapPanels,
  measureBytes,
  type Panel,
  PANELS,
  readErrorMessage,
  type Result,
} from "shared";
import { ref } from "vue";

import { PANEL_TITLES } from "@/constants";
import { useSDK } from "@/plugins/sdk";
import { type SendRequest } from "@/utils/sendRequest";
import { chooseTransport, withUploadedFile } from "@/utils/upload";

type ItemTarget = Omit<AddFileItemInput, "path">;

const UPLOADED_TEXT_NAME = "compare-item.txt";

export const useItemsStore = defineStore("items", () => {
  const sdk = useSDK();

  const items = ref(mapPanels((): CompareItem[] => []));
  const selections = ref(mapPanels((): CompareItem[] => []));
  const pending = ref(mapPanels(() => 0));

  const isBusy = (panel: Panel): boolean => pending.value[panel] > 0;

  const showError = (message: string) => {
    sdk.window.showToast(message, { variant: "error" });
  };

  const request = async <T>(
    panel: Panel,
    action: string,
    call: () => Promise<Result<T>>,
  ): Promise<Result<T>> => {
    pending.value[panel] += 1;
    const result = await call().catch((error: unknown) =>
      err<T>(`The backend did not answer. ${readErrorMessage(error)}`),
    );
    pending.value[panel] -= 1;
    if (result.kind === "Error") {
      showError(`Unable to ${action}: ${result.error}`);
    }
    return result;
  };

  const load = async (panel: Panel) => {
    const listed = await request(panel, `load ${PANEL_TITLES[panel]}`, () =>
      sdk.backend.listItems(panel),
    );
    if (listed.kind === "Error") return;

    const ids = new Set(listed.value.map((item) => item.id));
    items.value[panel] = listed.value;
    selections.value[panel] = selections.value[panel].filter((item) =>
      ids.has(item.id),
    );
  };

  const loadAll = async () => {
    await Promise.all(PANELS.map(load));
  };

  const addUploaded = (file: File, target: ItemTarget) =>
    withUploadedFile(sdk.files, file, (path) =>
      sdk.backend.addFileItem({ ...target, path }),
    );

  const rejectTooLarge = (panel: Panel) => {
    showError(
      `Unable to add to ${PANEL_TITLES[panel]}: ${ITEM_TOO_LARGE_MESSAGE}`,
    );
    return err<CompareItem>(ITEM_TOO_LARGE_MESSAGE);
  };

  const addItem = async (input: AddItemInput) => {
    const { data, ...target } = input;
    const transport = chooseTransport(measureBytes(data));
    if (transport === "TooLarge") return rejectTooLarge(input.panel);

    return request(input.panel, `add to ${PANEL_TITLES[input.panel]}`, () =>
      transport === "Inline"
        ? sdk.backend.addItem(input)
        : addUploaded(new File([data], UPLOADED_TEXT_NAME), target),
    );
  };

  const addFile = async (panel: Panel, file: File) => {
    const target: ItemTarget = { panel, kind: "file", source: file.name };
    const transport = chooseTransport(file.size);
    if (transport === "TooLarge") return rejectTooLarge(panel);
    if (transport === "Inline") {
      return addItem({ ...target, data: await file.text() });
    }
    return request(panel, `add to ${PANEL_TITLES[panel]}`, () =>
      addUploaded(file, target),
    );
  };

  const pasteClipboard = async (panel: Panel) => {
    const text = await navigator.clipboard.readText().catch(() => undefined);
    if (text === undefined) {
      showError("Compare cannot read the clipboard.");
      return;
    }
    if (text.trim() === "") {
      showError("The clipboard is empty.");
      return;
    }
    await addItem({
      panel,
      kind: "clipboard",
      source: "clipboard",
      data: text,
    });
  };

  const removeSelected = async (panel: Panel) => {
    const ids = selections.value[panel].map((item) => item.id);
    await request(panel, `remove from ${PANEL_TITLES[panel]}`, () =>
      sdk.backend.removeItems({ panel, ids }),
    );
  };

  const clear = async (panel: Panel) => {
    await request(panel, `clear ${PANEL_TITLES[panel]}`, () =>
      sdk.backend.clearPanel(panel),
    );
  };

  const move = async (panel: Panel, moving: CompareItem[]) => {
    const ids = moving.map((item) => item.id);
    const target = PANEL_TITLES[getOtherPanel(panel)];
    await request(panel, `move items to ${target}`, () =>
      sdk.backend.moveItems({ panel, ids }),
    );
  };

  const send = async (outgoing: Exclude<SendRequest, { kind: "None" }>) => {
    const panel = outgoing.input.panel;
    const sent =
      outgoing.kind === "Requests"
        ? await request(panel, `send to ${PANEL_TITLES[panel]}`, () =>
            sdk.backend.addRequests(outgoing.input),
          )
        : await addItem(outgoing.input);
    if (sent.kind === "Ok") {
      sdk.window.showToast(`Sent to ${PANEL_TITLES[panel]}`, {
        variant: "success",
      });
    }
  };

  const initialize = () => {
    sdk.backend.onEvent("itemsChanged", () => void loadAll());
    void loadAll();
  };

  return {
    items,
    selections,
    isBusy,
    initialize,
    pasteClipboard,
    addFile,
    removeSelected,
    clear,
    move,
    send,
  };
});
