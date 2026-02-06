<script setup lang="ts">
import MenuBar from "primevue/menubar";

interface Props {
  currentTab?: string;
}

interface Emits {
  (e: "switch-tab", tab: string): void;
}

withDefaults(defineProps<Props>(), {
  currentTab: "compare",
});

const emit = defineEmits<Emits>();

const items = [
  {
    label: "Compare",
    command: () => {
      emit("switch-tab", "compare");
    },
  },
  {
    label: "Docs",
    command: () => {
      emit("switch-tab", "docs");
    },
  },
];
</script>

<template>
  <MenuBar breakpoint="320px">
    <template #start>
      <div class="flex">
        <div class="px-3 py-2 font-bold text-gray-300">Compare</div>
        <div
          v-for="(item, index) in items"
          :key="index"
          class="px-3 py-2 cursor-pointer text-gray-300 transition-all duration-200 ease-in-out"
          :class="{
            'bg-zinc-800/40': currentTab === item.label.toLowerCase(),
            'hover:bg-gray-800/10': currentTab !== item.label.toLowerCase(),
          }"
          @mousedown="item.command"
        >
          {{ item.label }}
        </div>
      </div>
    </template>

    <template #end>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="text-sm text-gray-400">
          Side-by-side comparison with diff highlighting
        </span>
      </div>
    </template>
  </MenuBar>
</template>
