import { ref } from "vue";

type Page = "Compare" | "Docs";

const PAGES: ReadonlyArray<Page> = ["Compare", "Docs"];

export const useForm = () => {
  const page = ref<Page>("Compare");

  return {
    page,
    pages: PAGES,
    selectPage: (next: Page) => {
      page.value = next;
    },
  };
};
