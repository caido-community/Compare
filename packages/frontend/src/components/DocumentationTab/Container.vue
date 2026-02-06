<script setup lang="ts">
import Card from "primevue/card";
import { onMounted, onUnmounted, ref } from "vue";

interface Emits {
  (e: "switch-tab", tab: string): void;
}

const emit = defineEmits<Emits>();

const sections = [
  { id: "what-is-compare", title: "What is Compare?" },
  { id: "quick-start", title: "Quick Start" },
  { id: "data-input", title: "Data Input Methods" },
  { id: "comparison-types", title: "Comparison Types" },
  { id: "panel-management", title: "Panel Management" },
  { id: "http-history", title: "HTTP History Integration" },
  { id: "about", title: "About" },
];

const activeSection = ref("what-is-compare");

const contentRef = ref<HTMLElement>();

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element && contentRef.value) {
    contentRef.value.scrollTo({
      top: element.offsetTop - 20,
      behavior: "smooth",
    });
  }
};

const handleScroll = () => {
  if (contentRef.value === undefined) return;

  const scrollPosition = contentRef.value.scrollTop + 200;

  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i];
    if (section === undefined) continue;
    const element = document.getElementById(section.id);
    if (element !== null && element.offsetTop <= scrollPosition) {
      activeSection.value = section.id;
      break;
    }
  }
};

onMounted(() => {
  contentRef.value?.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  contentRef.value?.removeEventListener("scroll", handleScroll);
});

const isSectionActive = (sectionId: string) => {
  return activeSection.value === sectionId;
};
</script>

<template>
  <div class="h-full flex gap-1">
    <Card
      class="h-full w-[200px]"
      :pt="{
        body: { class: 'h-full p-0 flex flex-col' },
        content: { class: 'h-full flex flex-col' },
      }"
    >
      <template #content>
        <div class="h-full overflow-auto p-4">
          <nav class="space-y-1">
            <div
              v-for="section in sections"
              :key="section.id"
              class="cursor-pointer py-2 px-3 rounded text-sm transition-colors"
              :class="
                isSectionActive(section.id)
                  ? 'bg-surface-700 text-white font-medium'
                  : 'text-surface-300 hover:bg-surface-800 hover:text-white'
              "
              @click="scrollToSection(section.id)"
            >
              {{ section.title }}
            </div>
          </nav>
        </div>
      </template>
    </Card>

    <Card
      class="h-full flex-1"
      :pt="{
        body: { class: 'h-full p-0 flex flex-col' },
        content: { class: 'h-full flex flex-col overflow-auto' },
      }"
    >
      <template #content>
        <div ref="contentRef" class="h-full overflow-auto p-4">
          <div class="max-w-3xl space-y-12 pb-[36rem]">
            <section id="what-is-compare">
              <h2 class="text-2xl font-semibold mb-4">What is Compare?</h2>
              <p class="text-surface-300 leading-relaxed mb-4">
                Compare is a plugin for Caido that helps security professionals
                perform side-by-side comparison of HTTP requests, responses, and
                files with visual difference highlighting.
              </p>
              <p class="text-surface-300 leading-relaxed">
                Think of it as a dedicated diff tool built into Caido: load two
                pieces of data, compare them by words or bytes, and instantly
                see what's different with color-coded highlighting.
              </p>
            </section>

            <section id="quick-start">
              <h2 class="text-2xl font-semibold mb-4">Quick Start</h2>
              <p class="text-surface-300 leading-relaxed mb-6">
                Get up and running with Compare in just a few steps:
              </p>

              <div class="space-y-4">
                <div class="border border-surface-700 rounded p-4">
                  <h3 class="text-lg font-semibold mb-3">
                    1. Add Data to Original
                  </h3>
                  <p class="text-surface-300 leading-relaxed">
                    Paste content, load a file, or right-click a request in HTTP
                    History and select "Send to Original".
                  </p>
                </div>

                <div class="border border-surface-700 rounded p-4">
                  <h3 class="text-lg font-semibold mb-3">
                    2. Add Data to Modified
                  </h3>
                  <p class="text-surface-300 leading-relaxed">
                    Add the second piece of content you want to compare using
                    the same methods - paste, file, or from HTTP History.
                  </p>
                </div>

                <div class="border border-surface-700 rounded p-4">
                  <h3 class="text-lg font-semibold mb-3">3. Select Items</h3>
                  <p class="text-surface-300 leading-relaxed">
                    Click on one item in the Original panel and one item in the
                    Modified panel to select them for comparison.
                  </p>
                </div>

                <div class="border border-surface-700 rounded p-4">
                  <h3 class="text-lg font-semibold mb-3">4. Compare</h3>
                  <p class="text-surface-300 leading-relaxed">
                    Click "Compare Words" for text comparison or "Compare Bytes"
                    for character-by-character analysis.
                  </p>
                </div>
              </div>

              <div
                class="mt-6 bg-surface-800 border border-surface-700 rounded p-4"
              >
                <p class="text-surface-300 text-sm">
                  <i class="fas fa-rocket text-blue-400 mr-2"></i>
                  That's it! The comparison modal will show color-coded
                  differences between your two selections.
                </p>
              </div>
            </section>

            <section id="data-input">
              <h2 class="text-2xl font-semibold mb-4">Data Input Methods</h2>
              <p class="text-surface-300 leading-relaxed mb-6">
                There are several ways to add data to Compare:
              </p>

              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold mb-3">
                    1. Paste from Clipboard
                  </h3>
                  <p class="text-surface-300 leading-relaxed">
                    Copy any text to your clipboard and click the "Paste"
                    button. The content will be added as a clipboard item.
                  </p>
                </div>

                <div>
                  <h3 class="text-lg font-semibold mb-3">2. Load from File</h3>
                  <p class="text-surface-300 leading-relaxed">
                    Click "Load" to open a file picker. Select any text file (up
                    to 10MB) to add it to the panel.
                  </p>
                </div>

                <div>
                  <h3 class="text-lg font-semibold mb-3">
                    3. Send from HTTP History
                  </h3>
                  <p class="text-surface-300 leading-relaxed mb-3">
                    Right-click any request in Caido's HTTP History:
                  </p>
                  <ol
                    class="list-decimal list-inside space-y-2 text-surface-300 ml-4"
                  >
                    <li>Select "Send to Original" to add to the left panel</li>
                    <li>Select "Send to Modified" to add to the right panel</li>
                    <li>You can select multiple requests (up to 25)</li>
                  </ol>
                </div>
              </div>
            </section>

            <section id="comparison-types">
              <h2 class="text-2xl font-semibold mb-4">Comparison Types</h2>
              <p class="text-surface-300 leading-relaxed mb-6">
                Choose the right comparison method for your data:
              </p>

              <div class="space-y-6">
                <div class="border border-surface-700 rounded p-4">
                  <h3 class="text-lg font-semibold mb-2 text-green-400">
                    Word-Level Comparison
                  </h3>
                  <p class="text-surface-300 leading-relaxed mb-3">
                    Best for comparing HTTP requests, responses, and text
                    content. Uses intelligent word-boundary detection to
                    highlight meaningful differences.
                  </p>
                  <p class="text-surface-300 text-sm">
                    <strong>Use when:</strong> Comparing API responses, HTML
                    content, configuration files, or any structured text.
                  </p>
                </div>

                <div class="border border-surface-700 rounded p-4">
                  <h3 class="text-lg font-semibold mb-2 text-blue-400">
                    Byte-Level Comparison
                  </h3>
                  <p class="text-surface-300 leading-relaxed mb-3">
                    Character-by-character analysis for precise difference
                    detection. Shows every single character change.
                  </p>
                  <p class="text-surface-300 text-sm">
                    <strong>Use when:</strong> Comparing encoded content,
                    binary-like data, or when you need exact character
                    differences.
                  </p>
                </div>

                <div class="border border-surface-700 rounded p-4">
                  <h3 class="text-lg font-semibold mb-2 text-amber-400">
                    Line-Level Comparison
                  </h3>
                  <p class="text-surface-300 leading-relaxed mb-3">
                    Compares text line by line. Ideal for config files, scripts,
                    and HTTP bodies where changes are often whole-line.
                  </p>
                  <p class="text-surface-300 text-sm">
                    <strong>Use when:</strong> Comparing multi-line content
                    where each line is a logical unit.
                  </p>
                </div>

                <div class="border border-surface-700 rounded p-4">
                  <h3 class="text-lg font-semibold mb-2 text-surface-300">
                    Comparison Options
                  </h3>
                  <p class="text-surface-300 leading-relaxed mb-3">
                    <strong>Ignore whitespace:</strong> Normalizes spaces and
                    tabs within lines while preserving line breaks. Useful for
                    comparing formatted text where indentation varies.
                  </p>
                  <p class="text-surface-300 leading-relaxed">
                    <strong>Ignore case:</strong> Performs case-insensitive
                    comparison. Perfect for comparing text where capitalization
                    differences don't matter.
                  </p>
                </div>
              </div>

              <div
                class="mt-6 bg-surface-800 border border-surface-700 rounded p-4"
              >
                <p class="text-surface-300 text-sm mb-3">
                  <i class="fas fa-palette text-blue-400 mr-2"></i>
                  <strong>Color coding:</strong>
                  <span
                    class="text-green-100 ml-2 bg-green-700/50 px-2 py-0.5 rounded-sm"
                    >Green = Added</span
                  >
                  <span
                    class="text-red-100 ml-2 bg-red-700/50 px-2 py-0.5 rounded-sm"
                    >Red = Deleted</span
                  >
                  <span
                    class="text-orange-100 ml-2 bg-orange-700/50 px-2 py-0.5 rounded-sm"
                    >Orange = Modified</span
                  >
                </p>
                <p class="text-surface-300 text-sm">
                  <i class="fas fa-tags text-blue-400 mr-2"></i>
                  <strong>Item types:</strong>
                  <span
                    class="ml-2 bg-pink-600 text-white px-2 py-0.5 rounded-sm text-xs"
                    >clipboard</span
                  >
                  <span
                    class="ml-2 bg-blue-600 text-white px-2 py-0.5 rounded-sm text-xs"
                    >file</span
                  >
                  <span
                    class="ml-2 bg-purple-600 text-white px-2 py-0.5 rounded-sm text-xs"
                    >request</span
                  >
                  <span
                    class="ml-2 bg-teal-600 text-white px-2 py-0.5 rounded-sm text-xs"
                    >response</span
                  >
                </p>
              </div>
            </section>

            <section id="panel-management">
              <h2 class="text-2xl font-semibold mb-4">Panel Management</h2>
              <p class="text-surface-300 leading-relaxed mb-6">
                Efficiently organize and manage your comparison data:
              </p>

              <div class="space-y-4">
                <div class="border-l-4 border-blue-500 pl-4">
                  <h4 class="font-semibold mb-1">Remove</h4>
                  <p class="text-surface-300 text-sm">
                    Select items and click "Remove" to delete them from the
                    panel.
                  </p>
                </div>
                <div class="border-l-4 border-blue-500 pl-4">
                  <h4 class="font-semibold mb-1">Clear</h4>
                  <p class="text-surface-300 text-sm">
                    Click "Clear" to remove all items from a panel at once.
                  </p>
                </div>
                <div class="border-l-4 border-blue-500 pl-4">
                  <h4 class="font-semibold mb-1">Transfer</h4>
                  <p class="text-surface-300 text-sm">
                    Right-click any item and select "Transfer" to move it to the
                    other panel. Works with multiple selected items.
                  </p>
                </div>
                <div class="border-l-4 border-blue-500 pl-4">
                  <h4 class="font-semibold mb-1">Multi-Select</h4>
                  <p class="text-surface-300 text-sm">
                    Click checkboxes to select multiple items for bulk
                    operations.
                  </p>
                </div>
              </div>

              <div
                class="mt-6 bg-surface-800 border border-surface-700 rounded p-4"
              >
                <p class="text-surface-300 text-sm">
                  <i class="fas fa-info-circle text-blue-400 mr-2"></i>
                  Data automatically persists per project. Switch projects and
                  your Compare data stays organized.
                </p>
              </div>
            </section>

            <section id="http-history">
              <h2 class="text-2xl font-semibold mb-4">
                HTTP History Integration
              </h2>
              <p class="text-surface-300 leading-relaxed mb-6">
                Compare integrates directly with Caido's HTTP History for quick
                access:
              </p>

              <div class="space-y-4">
                <div class="border border-surface-700 rounded p-4">
                  <h4 class="font-semibold mb-3">Individual Requests</h4>
                  <ol
                    class="list-decimal list-inside space-y-2 text-surface-300"
                  >
                    <li>Right-click any request in HTTP History</li>
                    <li>Select "Send to Original" or "Send to Modified"</li>
                    <li>Request data appears automatically in Compare</li>
                  </ol>
                </div>

                <div class="border border-surface-700 rounded p-4">
                  <h4 class="font-semibold mb-3">Bulk Operations</h4>
                  <ol
                    class="list-decimal list-inside space-y-2 text-surface-300"
                  >
                    <li>Select multiple requests (up to 25)</li>
                    <li>
                      Right-click → "Send to Original" or "Send to Modified"
                    </li>
                    <li>All requests are processed automatically</li>
                  </ol>
                </div>
              </div>
            </section>

            <section id="about">
              <h2 class="text-2xl font-semibold mb-4">About</h2>
              <p class="text-surface-300 leading-relaxed mb-6">
                Compare is a professional Caido plugin for security
                professionals who need precise side-by-side comparison
                capabilities.
              </p>

              <div class="border border-surface-700 rounded p-4">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h3 class="text-xl font-bold">Compare</h3>
                    <p class="text-sm text-surface-400">Version 1.0.2</p>
                  </div>
                </div>

                <div class="pt-4 border-t border-surface-700">
                  <div
                    class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                  >
                    <div class="text-sm text-surface-300">
                      <span class="font-medium">Made with</span>
                      <i class="fas fa-heart text-red-500 mx-1"></i>
                      <span class="font-medium">by</span>
                      <a
                        href="https://amrelsagaei.com"
                        target="_blank"
                        class="font-medium text-primary-400 hover:text-primary-300 transition-colors ml-1"
                      >
                        Amr Elsagaei
                      </a>
                    </div>
                    <div class="flex gap-4">
                      <a
                        href="mailto:info@amrelsagaei.com"
                        class="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
                      >
                        <i class="fas fa-envelope"></i>
                        Email
                      </a>
                      <a
                        href="https://www.linkedin.com/in/amrelsagaei"
                        target="_blank"
                        class="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
                      >
                        <i class="fab fa-linkedin"></i>
                        LinkedIn
                      </a>
                      <a
                        href="https://x.com/amrelsagaei"
                        target="_blank"
                        class="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
                      >
                        <i class="fab fa-x-twitter"></i>
                        X/Twitter
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
