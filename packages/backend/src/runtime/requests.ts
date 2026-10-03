import type { SDK } from "caido:plugin";
import { err, ok, type Result, type Spec } from "shared";

type RequestContent = { source: string; data: string };

export type RequestReader = (
  requestId: string,
) => Promise<Result<RequestContent>>;

export const buildRequestReader =
  (sdk: SDK<Spec>): RequestReader =>
  async (requestId) => {
    const found = await sdk.requests.get(requestId);
    if (found === undefined) {
      return err(`Request ${requestId} no longer exists in this project.`);
    }

    return ok({
      source: found.request.getUrl(),
      data: found.request.getRaw().toText(),
    });
  };
