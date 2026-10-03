import {
  type CompareItem,
  getOtherPanel,
  type Panel,
  type Result,
} from "shared";
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  type Ref,
  useTemplateRef,
} from "vue";

import { useRowMenu } from "./useRowMenu";

import { PANEL_ACTIONS, PANEL_TITLES } from "@/presentation/panels";
import { type Services } from "@/services";

type ToolbarAction = {
  label: string;
  icon: string;
  severity: "danger" | "secondary" | undefined;
  isDisabled: boolean;
  run: () => void;
};

const getPreview = (item: CompareItem): string =>
  item.data.split("\n", 1)[0] ?? "";

const formatTime = (item: CompareItem): string =>
  new Date(item.createdAt).toLocaleTimeString();

export const useForm = (options: {
  panel: Panel;
  services: Pick<Services, "items" | "notifications">;
  selected: Ref<CompareItem[]>;
}) => {
  const { panel, services, selected } = options;
  const title = PANEL_TITLES[panel];
  const targetTitle = PANEL_TITLES[getOtherPanel(panel)];
  const items = ref<CompareItem[]>([]);
  const pending = ref(0);
  const isBusy = computed(() => pending.value > 0);
  const fileInput = useTemplateRef<HTMLInputElement>("fileInput");

  const run = async <T>(
    action: string,
    operation: () => Promise<Result<T>>,
  ) => {
    pending.value += 1;
    const result = await operation();
    pending.value -= 1;
    if (result.kind === "Error") {
      services.notifications.showError(`Unable to ${action}: ${result.error}`);
    }
    return result;
  };

  const load = async () => {
    const listed = await run(`load ${title}`, () =>
      services.items.listItems(panel),
    );
    if (listed.kind === "Error") return;

    const ids = new Set(listed.value.map((item) => item.id));
    items.value = listed.value;
    selected.value = selected.value.filter((item) => ids.has(item.id));
  };

  const pasteClipboard = async () => {
    const text = await navigator.clipboard.readText().catch(() => undefined);
    if (text === undefined) {
      services.notifications.showError("Compare cannot read the clipboard.");
      return;
    }
    if (text.trim() === "") {
      services.notifications.showError("The clipboard is empty.");
      return;
    }
    await run(`add to ${title}`, () =>
      services.items.addItem({
        panel,
        kind: "clipboard",
        source: "clipboard",
        data: text,
      }),
    );
  };

  const addChosenFile = async (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;

    const file = input.files?.[0];
    input.value = "";
    if (file === undefined) return;
    await run(`add to ${title}`, () => services.items.addFile(panel, file));
  };

  const removeSelected = async () => {
    const ids = selected.value.map((item) => item.id);
    await run(`remove from ${title}`, () =>
      services.items.removeItems({ panel, ids }),
    );
  };

  const clear = async () => {
    await run(`clear ${title}`, () => services.items.clearPanel(panel));
  };

  const moveToOtherPanel = async (moving: CompareItem[]) => {
    const ids = moving.map((item) => item.id);
    await run(`move items to ${targetTitle}`, () =>
      services.items.moveItems({ panel, ids }),
    );
  };

  const toolbar = computed((): ToolbarAction[] => [
    {
      ...PANEL_ACTIONS.paste,
      severity: undefined,
      isDisabled: isBusy.value,
      run: () => void pasteClipboard(),
    },
    {
      ...PANEL_ACTIONS.load,
      severity: undefined,
      isDisabled: isBusy.value,
      run: () => fileInput.value?.click(),
    },
    {
      ...PANEL_ACTIONS.remove,
      severity: "danger",
      isDisabled: isBusy.value || selected.value.length === 0,
      run: () => void removeSelected(),
    },
    {
      ...PANEL_ACTIONS.clear,
      severity: "secondary",
      isDisabled: isBusy.value || items.value.length === 0,
      run: () => void clear(),
    },
  ]);

  const stopListening = services.items.onItemsChanged(() => void load());
  onMounted(() => void load());
  onUnmounted(stopListening);

  return {
    title,
    items,
    isBusy,
    toolbar,
    addChosenFile,
    getPreview,
    formatTime,
    ...useRowMenu({ targetTitle, selected, move: moveToOtherPanel }),
  };
};
