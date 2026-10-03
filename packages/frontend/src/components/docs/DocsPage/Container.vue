<script setup lang="ts">
import Card from "primevue/card";
import { ITEM_KINDS } from "shared";

import Callout from "./Callout.vue";
import CalloutLine from "./CalloutLine.vue";
import {
  ABOUT_TEXT,
  AUTHOR,
  COMPARISON_OPTIONS,
  COMPARISON_TYPES,
  CONTACT_LINKS,
  HISTORY_GUIDES,
  HISTORY_INPUT,
  INPUT_METHODS,
  INTRODUCTION,
  PANEL_ACTION_GUIDES,
  PER_PROJECT_NOTE,
  QUICK_START_NOTE,
  QUICK_START_STEPS,
  SECTIONS,
} from "./content";
import InfoCard from "./InfoCard.vue";
import DocsSection from "./Section.vue";
import { useForm } from "./useForm";

import { ItemKindTag } from "@/components/common/ItemKindTag";
import { CHANGE_DETAILS } from "@/presentation/diff";
import { INFO_ICON, PLUGIN_NAME } from "@/presentation/plugin";

defineOptions({ name: "DocsPage" });

const form = useForm();

const CARD_PT = {
  body: { class: "h-full p-0 flex flex-col" },
  content: { class: "h-full flex flex-col" },
};

const LEGEND_KINDS = ["added", "deleted", "modified"] as const;

const LINK_CLASS =
  "flex items-center gap-1 text-sm text-primary-400 transition-colors hover:text-primary-300";
</script>

<template>
  <div class="h-full flex gap-1">
    <Card class="h-full w-[200px]" :pt="CARD_PT">
      <template #content>
        <nav class="h-full overflow-auto p-4 space-y-1">
          <div
            v-for="section in SECTIONS"
            :key="section.id"
            class="cursor-pointer py-2 px-3 rounded text-sm transition-colors"
            :class="
              form.activeSection.value === section.id
                ? 'bg-surface-700 text-surface-0 font-medium'
                : 'text-surface-300 hover:bg-surface-800 hover:text-surface-0'
            "
            @click="form.scrollToSection(section.id)"
          >
            {{ section.title }}
          </div>
        </nav>
      </template>
    </Card>

    <Card class="h-full flex-1" :pt="CARD_PT">
      <template #content>
        <div
          ref="content"
          class="h-full overflow-auto p-4"
          @scroll="form.trackActiveSection"
        >
          <div class="max-w-3xl space-y-12 pb-[36rem]">
            <DocsSection id="what-is-compare" class="space-y-4">
              <p v-for="paragraph in INTRODUCTION" :key="paragraph">
                {{ paragraph }}
              </p>
            </DocsSection>

            <DocsSection id="quick-start">
              <p class="mb-6">Get started with Compare in a few steps:</p>
              <div class="space-y-4">
                <InfoCard
                  v-for="step in QUICK_START_STEPS"
                  :key="step.title"
                  :title="step.title"
                >
                  <p>{{ step.text }}</p>
                </InfoCard>
              </div>
              <Callout>
                <CalloutLine icon="fas fa-rocket">
                  {{ QUICK_START_NOTE }}
                </CalloutLine>
              </Callout>
            </DocsSection>

            <DocsSection id="data-input">
              <p class="mb-6">There are several ways to add data to Compare:</p>
              <div class="space-y-6">
                <div v-for="method in INPUT_METHODS" :key="method.title">
                  <h3 class="mb-3 text-lg font-semibold text-surface-0">
                    {{ method.title }}
                  </h3>
                  <p>{{ method.text }}</p>
                </div>
                <div>
                  <h3 class="mb-3 text-lg font-semibold text-surface-0">
                    {{ HISTORY_INPUT.title }}
                  </h3>
                  <p class="mb-3">Right-click any request in HTTP History:</p>
                  <ol class="ml-4 list-inside list-decimal space-y-2">
                    <li v-for="step in HISTORY_INPUT.steps" :key="step">
                      {{ step }}
                    </li>
                  </ol>
                </div>
              </div>
            </DocsSection>

            <DocsSection id="comparison-types">
              <p class="mb-6">Choose the right comparison for your data:</p>
              <div class="space-y-6">
                <InfoCard
                  v-for="type in COMPARISON_TYPES"
                  :key="type.title"
                  :title="type.title"
                  :title-class="type.titleClass"
                >
                  <p class="mb-3">{{ type.text }}</p>
                  <p class="text-sm">
                    <strong>Use when:</strong> {{ type.useWhen }}
                  </p>
                </InfoCard>
                <InfoCard title="Comparison Options">
                  <p
                    v-for="option in COMPARISON_OPTIONS"
                    :key="option.title"
                    class="mb-3 last:mb-0"
                  >
                    <strong>{{ option.title }}:</strong> {{ option.text }}
                  </p>
                </InfoCard>
              </div>
              <Callout>
                <CalloutLine icon="fas fa-palette">
                  <strong>Color coding:</strong>
                  <span
                    v-for="kind in LEGEND_KINDS"
                    :key="kind"
                    class="ml-2 rounded-sm px-2 py-0.5"
                    :class="CHANGE_DETAILS[kind].chipClass"
                    >{{ CHANGE_DETAILS[kind].label }}</span
                  >
                </CalloutLine>
                <CalloutLine icon="fas fa-tags">
                  <strong>Item types:</strong>
                  <ItemKindTag
                    v-for="kind in ITEM_KINDS"
                    :key="kind"
                    :kind="kind"
                    class="ml-2"
                  />
                </CalloutLine>
              </Callout>
            </DocsSection>

            <DocsSection id="panel-management">
              <p class="mb-6">Organize and manage your comparison data:</p>
              <div class="space-y-4">
                <div
                  v-for="guide in PANEL_ACTION_GUIDES"
                  :key="guide.title"
                  class="border-l-4 border-blue-500 pl-4"
                >
                  <h4 class="mb-1 font-semibold text-surface-0">
                    {{ guide.title }}
                  </h4>
                  <p class="text-sm">{{ guide.text }}</p>
                </div>
              </div>
              <Callout>
                <CalloutLine :icon="INFO_ICON">{{
                  PER_PROJECT_NOTE
                }}</CalloutLine>
              </Callout>
            </DocsSection>

            <DocsSection id="http-history">
              <p class="mb-6">
                Compare works directly with Caido's HTTP History:
              </p>
              <div class="space-y-4">
                <InfoCard
                  v-for="guide in HISTORY_GUIDES"
                  :key="guide.title"
                  :title="guide.title"
                >
                  <ol class="list-inside list-decimal space-y-2">
                    <li v-for="step in guide.steps" :key="step">{{ step }}</li>
                  </ol>
                </InfoCard>
              </div>
            </DocsSection>

            <DocsSection id="about">
              <p class="mb-6">{{ ABOUT_TEXT }}</p>
              <div class="rounded border border-surface-700 p-4">
                <div class="mb-4">
                  <h3 class="text-xl font-bold text-surface-0">
                    {{ PLUGIN_NAME }}
                  </h3>
                  <p class="text-sm text-surface-400">
                    Version {{ form.version }}
                  </p>
                </div>
                <div
                  class="flex flex-col items-start justify-between gap-4 border-t border-surface-700 pt-4 sm:flex-row sm:items-center"
                >
                  <div class="text-sm">
                    <span class="font-medium">Made with</span>
                    <i class="fas fa-heart mx-1 text-red-500" />
                    <span class="font-medium">by</span>
                    <a
                      :href="AUTHOR.url"
                      target="_blank"
                      class="ml-1 font-medium text-primary-400 transition-colors hover:text-primary-300"
                    >
                      {{ AUTHOR.name }}
                    </a>
                  </div>
                  <div class="flex gap-4">
                    <a
                      v-for="link in CONTACT_LINKS"
                      :key="link.label"
                      :href="link.href"
                      target="_blank"
                      :class="LINK_CLASS"
                    >
                      <i :class="link.icon" />
                      {{ link.label }}
                    </a>
                  </div>
                </div>
              </div>
            </DocsSection>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
