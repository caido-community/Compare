import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";

export const mountComposable = async <T>(build: () => T): Promise<T> => {
  const built: T[] = [];

  mount(
    defineComponent({
      setup() {
        built.push(build());
        return () => undefined;
      },
    }),
  );

  await flushPromises();

  const form = built[0];
  if (form === undefined) throw new Error("the component did not set up");
  return form;
};
