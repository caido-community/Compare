import { ref, useTemplateRef } from "vue";

import { type SectionId, SECTIONS } from "./content";

const ACTIVE_OFFSET = 200;

const SCROLL_MARGIN = 20;

const FIRST_SECTION_ID: SectionId = SECTIONS[0].id;

export const useForm = () => {
  const content = useTemplateRef<HTMLElement>("content");
  const activeSection = ref<SectionId>(FIRST_SECTION_ID);

  const findSection = (id: SectionId): HTMLElement | undefined =>
    content.value?.querySelector<HTMLElement>(`[data-section="${id}"]`) ??
    undefined;

  const scrollToSection = (id: SectionId) => {
    const section = findSection(id);
    if (section === undefined) return;
    content.value?.scrollTo({
      top: section.offsetTop - SCROLL_MARGIN,
      behavior: "smooth",
    });
  };

  const trackActiveSection = () => {
    const position = (content.value?.scrollTop ?? 0) + ACTIVE_OFFSET;
    const passed = SECTIONS.filter(
      (section) => (findSection(section.id)?.offsetTop ?? 0) <= position,
    );
    activeSection.value = passed.at(-1)?.id ?? FIRST_SECTION_ID;
  };

  return {
    activeSection,
    version: __PLUGIN_VERSION__,
    scrollToSection,
    trackActiveSection,
  };
};
