<script setup lang="ts">
import Button from "primevue/button";
import MenuBar from "primevue/menubar";

import { useForm } from "./useForm";

import { ComparePage } from "@/components/compare/ComparePage";
import { DocsPage } from "@/components/docs/DocsPage";
import { type Services } from "@/services";

defineOptions({ name: "App" });

const { services } = defineProps<{ services: Services }>();

const form = useForm();
</script>

<template>
  <div class="h-full min-h-0 flex flex-col gap-1">
    <MenuBar breakpoint="320px" class="h-12 gap-2 shrink-0">
      <template #start>
        <div class="flex items-center gap-2">
          <div class="px-2 font-bold text-surface-100">Compare</div>
          <Button
            v-for="item in form.pages"
            :key="item"
            :label="item"
            size="small"
            :severity="form.page.value === item ? 'secondary' : 'contrast'"
            :outlined="form.page.value === item"
            :text="form.page.value !== item"
            @click="form.selectPage(item)"
          />
        </div>
      </template>
    </MenuBar>

    <div class="flex-1 min-h-0">
      <ComparePage v-if="form.page.value === 'Compare'" :services="services" />
      <DocsPage v-else />
    </div>
  </div>
</template>
