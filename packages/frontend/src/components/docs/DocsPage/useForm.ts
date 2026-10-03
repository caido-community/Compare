import { ref, useTemplateRef } from "vue";

const SECTIONS = [
  { id: "what-is-compare", title: "What is Compare?" },
  { id: "quick-start", title: "Quick Start" },
  { id: "data-input", title: "Data Input Methods" },
  { id: "comparison-types", title: "Comparison Types" },
  { id: "panel-management", title: "Panel Management" },
  { id: "http-history", title: "HTTP History Integration" },
  { id: "about", title: "About" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const ACTIVE_OFFSET = 200;

export const useForm = () => {
  const content = useTemplateRef<HTMLElement>("content");
  const activeSection = ref<SectionId>("what-is-compare");

  const findSection = (id: SectionId) =>
    content.value?.querySelector<HTMLElement>(`[data-section="${id}"]`);

  const scrollToSection = (id: SectionId) => {
    const section = findSection(id);
    if (section === undefined || section === null) return;
    content.value?.scrollTo({
      top: section.offsetTop - 20,
      behavior: "smooth",
    });
  };

  const trackActiveSection = () => {
    const position = (content.value?.scrollTop ?? 0) + ACTIVE_OFFSET;
    const passed = SECTIONS.filter(
      (section) => (findSection(section.id)?.offsetTop ?? 0) <= position,
    );
    activeSection.value = passed.at(-1)?.id ?? "what-is-compare";
  };

  return {
    sections: SECTIONS,
    activeSection,
    version: __PLUGIN_VERSION__,
    scrollToSection,
    trackActiveSection,
  };
};
