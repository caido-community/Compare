<script setup lang="ts">
import Checkbox from "primevue/checkbox";
import Dialog from "primevue/dialog";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";

import type { ComparisonDiff, ComparisonViewResult } from "@/types";

type Props = {
  visible: boolean;
  comparisonResult: ComparisonViewResult | undefined;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  close: [];
}>();

const syncViews = ref(false);
const leftScrollArea = ref<HTMLElement>();
const rightScrollArea = ref<HTMLElement>();

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const comparisonStats = computed(() => props.comparisonResult?.summary ?? null);

const getDiffClass = (type: ComparisonDiff["type"]): string => {
  const isLines = props.comparisonResult?.type === "lines";

  switch (type) {
    case "added":
      return isLines
        ? "bg-green-700/40 text-green-100"
        : "bg-green-700/50 text-green-100";
    case "deleted":
      return isLines
        ? "bg-red-700/40 text-red-100"
        : "bg-red-700/50 text-red-100";
    case "modified":
      return isLines
        ? "bg-orange-700/40 text-orange-100"
        : "bg-orange-700/50 text-orange-100";
    case "unchanged":
      return "text-surface-700 dark:text-surface-300";
    default:
      return "";
  }
};

const isLineMode = computed(() => props.comparisonResult?.type === "lines");

const handleClose = () => {
  emit("close");
  emit("update:visible", false);
};

const handleScroll = (event: Event, isLeft: boolean) => {
  if (!syncViews.value) return;

  const source = event.target as HTMLElement;
  const target = isLeft ? rightScrollArea.value : leftScrollArea.value;

  if (target && source.scrollTop !== target.scrollTop) {
    target.scrollTop = source.scrollTop;
  }

  if (target && source.scrollLeft !== target.scrollLeft) {
    target.scrollLeft = source.scrollLeft;
  }
};

const setupScrollListeners = () => {
  if (leftScrollArea.value) {
    leftScrollArea.value.addEventListener("scroll", (e) =>
      handleScroll(e, true),
    );
  }
  if (rightScrollArea.value) {
    rightScrollArea.value.addEventListener("scroll", (e) =>
      handleScroll(e, false),
    );
  }
};

const removeScrollListeners = () => {
  if (leftScrollArea.value) {
    leftScrollArea.value.removeEventListener("scroll", (e) =>
      handleScroll(e, true),
    );
  }
  if (rightScrollArea.value) {
    rightScrollArea.value.removeEventListener("scroll", (e) =>
      handleScroll(e, false),
    );
  }
};

watch(isVisible, (newVisible) => {
  if (newVisible) {
    nextTick(() => {
      setupScrollListeners();
    });
  } else {
    removeScrollListeners();
  }
});

onMounted(() => {
  if (isVisible.value) {
    setupScrollListeners();
  }
});

onUnmounted(() => {
  removeScrollListeners();
});
</script>

<template>
  <Dialog
    :visible="isVisible"
    modal
    :closable="true"
    :draggable="false"
    class="comparison-modal"
    :style="{ width: '90vw', maxWidth: '1400px', minWidth: '800px' }"
    :pt="{
      root: {
        class: 'max-h-[90vh] min-h-[30vh] bg-surface-900',
      },
      content: { class: 'flex flex-col min-h-[35vh]' },
      mask: { class: 'bg-black/60' },
    }"
    @update:visible="isVisible = $event"
    @hide="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-4">
        <i class="fas fa-columns text-primary"></i>
        <span class="text-lg font-semibold">
          Comparison Results:
          {{
            comparisonResult?.type === "words"
              ? "Words"
              : comparisonResult?.type === "bytes"
                ? "Bytes"
                : "Lines"
          }}
        </span>
      </div>
    </template>

    <div v-if="comparisonResult" class="h-full flex flex-col px-4">
      <div class="bg-surface-50 dark:bg-surface-800 p-3 rounded-lg mb-3">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <h3
              class="font-semibold text-sm text-surface-700 dark:text-surface-300 mb-2"
            >
              Original (ID: {{ comparisonResult.id1 }})
            </h3>
            <div class="flex flex-wrap gap-2 text-xs">
              <span class="px-2 py-1 text-white text-xs rounded-sm bg-primary"
                >Length: {{ comparisonResult.length1 }}</span
              >
              <span
                class="px-2 py-1 bg-surface-600 text-white text-xs rounded-sm"
                >Source: {{ comparisonResult.source1 || "Unknown" }}</span
              >
            </div>
          </div>
          <div>
            <h3
              class="font-semibold text-sm text-surface-700 dark:text-surface-300 mb-2"
            >
              Modified (ID: {{ comparisonResult.id2 }})
            </h3>
            <div class="flex flex-wrap gap-2 text-xs">
              <span class="px-2 py-1 text-white text-xs rounded-sm bg-primary"
                >Length: {{ comparisonResult.length2 }}</span
              >
              <span
                class="px-2 py-1 bg-surface-600 text-white text-xs rounded-sm"
                >Source: {{ comparisonResult.source2 || "Unknown" }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div
          class="border border-surface-300 dark:border-surface-700 rounded-lg overflow-hidden"
        >
          <div
            class="bg-surface-100 dark:bg-surface-800 px-3 py-2 border-b border-surface-300 dark:border-surface-700"
          >
            <span class="text-sm font-medium"
              >Original (ID: {{ comparisonResult.id1 }})</span
            >
          </div>
          <div
            ref="leftScrollArea"
            class="min-h-[150px] max-h-[calc(90vh-15rem)] overflow-auto bg-surface-0 dark:bg-surface-900 font-mono text-sm"
          >
            <template v-if="isLineMode">
              <div
                v-for="(diff, index) in comparisonResult.diffs1"
                :key="`left-${index}`"
                :class="getDiffClass(diff.type)"
                class="px-4 py-0.5 block whitespace-pre-wrap break-words"
              >
                {{ diff.content }}
              </div>
            </template>
            <div v-else class="p-4 whitespace-pre-wrap break-words">
              <span
                v-for="(diff, index) in comparisonResult.diffs1"
                :key="`left-${index}`"
                :class="getDiffClass(diff.type)"
              >
                {{ diff.content }}
              </span>
            </div>
          </div>
        </div>

        <div
          class="border border-surface-300 dark:border-surface-700 rounded-lg overflow-hidden"
        >
          <div
            class="bg-surface-100 dark:bg-surface-800 px-3 py-2 border-b border-surface-300 dark:border-surface-700"
          >
            <span class="text-sm font-medium"
              >Modified (ID: {{ comparisonResult.id2 }})</span
            >
          </div>
          <div
            ref="rightScrollArea"
            class="min-h-[150px] max-h-[calc(90vh-15rem)] overflow-auto bg-surface-0 dark:bg-surface-900 font-mono text-sm"
          >
            <template v-if="isLineMode">
              <div
                v-for="(diff, index) in comparisonResult.diffs2"
                :key="`right-${index}`"
                :class="getDiffClass(diff.type)"
                class="px-4 py-0.5 block whitespace-pre-wrap break-words"
              >
                {{ diff.content }}
              </div>
            </template>
            <div v-else class="p-4 whitespace-pre-wrap break-words">
              <span
                v-for="(diff, index) in comparisonResult.diffs2"
                :key="`right-${index}`"
                :class="getDiffClass(diff.type)"
              >
                {{ diff.content }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center w-full pt-3">
        <div v-if="comparisonStats" class="flex gap-4 text-xs">
          <div class="flex items-center gap-1">
            <div
              class="w-3 h-3 bg-green-700/50 border border-green-600 rounded-sm"
            ></div>
            <span class="text-green-100"
              >Added: {{ comparisonStats.added }}</span
            >
          </div>
          <div class="flex items-center gap-1">
            <div
              class="w-3 h-3 bg-red-700/50 border border-red-600 rounded-sm"
            ></div>
            <span class="text-red-100"
              >Deleted: {{ comparisonStats.deleted }}</span
            >
          </div>
          <div class="flex items-center gap-1">
            <div
              class="w-3 h-3 bg-orange-700/50 border border-orange-600 rounded-sm"
            ></div>
            <span class="text-orange-100"
              >Modified: {{ comparisonStats.modified }}</span
            >
          </div>
          <div class="flex items-center gap-1">
            <div
              class="w-3 h-3 bg-surface-500/20 border border-surface-600 rounded-sm"
            ></div>
            <span>Unchanged: {{ comparisonStats.unchanged }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Checkbox v-model="syncViews" :binary="true" input-id="sync-views" />
          <label for="sync-views" class="text-sm font-medium">
            Sync Views
          </label>
        </div>
      </div>
    </template>
  </Dialog>
</template>
