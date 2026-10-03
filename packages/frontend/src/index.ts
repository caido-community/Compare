import { Classic } from "@caido/primevue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import { PANELS } from "shared";
import { createApp } from "vue";

import { PLUGIN_ICON, PLUGIN_NAME, SEND_LABELS } from "./constants";
import { SDKPlugin } from "./plugins/sdk";
import { useItemsStore } from "./stores/items";
import "./styles/index.css";
import { type FrontendSDK } from "./types";
import { buildSendRequest } from "./utils/sendRequest";
import App from "./views/App.vue";

const PAGE_PATH = `/${__PLUGIN_ID__}`;

const MENU_TYPES = ["Request", "RequestRow", "Response"] as const;

export const init = (sdk: FrontendSDK) => {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(PrimeVue, { unstyled: true, pt: Classic });
  app.use(SDKPlugin, sdk);

  const root = document.createElement("div");
  Object.assign(root.style, { height: "100%", width: "100%" });
  root.id = `plugin--${__PLUGIN_ID__}`;
  app.mount(root);

  sdk.navigation.addPage(PAGE_PATH, { body: root });
  sdk.sidebar.registerItem(PLUGIN_NAME, PAGE_PATH, { icon: PLUGIN_ICON });

  const itemsStore = useItemsStore(pinia);

  for (const panel of PANELS) {
    const commandId = `${__PLUGIN_ID__}.send-to-${panel}`;

    sdk.commands.register(commandId, {
      name: SEND_LABELS[panel],
      run: (context) => {
        const request = buildSendRequest(panel, context);
        if (request.kind !== "None") void itemsStore.send(request);
      },
    });

    for (const type of MENU_TYPES) {
      sdk.menu.registerItem({ type, commandId, leadingIcon: PLUGIN_ICON });
    }
  }
};
