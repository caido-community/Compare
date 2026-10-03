import { Classic } from "@caido/primevue";
import PrimeVue from "primevue/config";
import { createApp } from "vue";

import { registerCommands } from "./commands";
import { buildServices, type Services } from "./services";
import "./styles/index.css";
import type { FrontendSDK } from "./types";
import App from "./views/App.vue";

const mountPage = (sdk: FrontendSDK, services: Services) => {
  const app = createApp(App, { services });
  app.use(PrimeVue, { unstyled: true, pt: Classic });

  const root = document.createElement("div");
  Object.assign(root.style, { height: "100%", width: "100%" });
  root.id = `plugin--${__PLUGIN_ID__}`;
  app.mount(root);

  sdk.navigation.addPage(`/${__PLUGIN_ID__}`, { body: root });
  sdk.sidebar.registerItem("Compare", `/${__PLUGIN_ID__}`, {
    icon: "fas fa-columns",
  });
};

export const init = (sdk: FrontendSDK) => {
  const services = buildServices(sdk);
  mountPage(sdk, services);
  registerCommands(sdk, services);
};
