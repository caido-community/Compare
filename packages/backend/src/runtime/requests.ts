import type { SDK } from "caido:plugin";
import { err, ok, type Spec } from "shared";

import { type RequestReader } from "../items/api";

export const buildRequestReader =
  (sdk: SDK<Spec>): RequestReader =>
  async (requestId) => {
    const found = await sdk.requests.get(requestId);
    if (found === undefined) {
      return err(`Request ${requestId} no longer exists in this project.`);
    }

    const { request } = found;
    return ok({ source: request.getUrl(), data: request.getRaw().toText() });
  };
