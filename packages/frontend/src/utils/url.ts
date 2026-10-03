import { type RequestMeta } from "@caido/sdk-frontend";

type Endpoint = Pick<RequestMeta, "host" | "port" | "path" | "query" | "isTls">;

export const buildUrl = (endpoint: Endpoint): string => {
  const scheme = endpoint.isTls ? "https" : "http";
  const isDefaultPort = endpoint.port === (endpoint.isTls ? 443 : 80);
  const port = isDefaultPort ? "" : `:${endpoint.port}`;
  const query = endpoint.query === "" ? "" : `?${endpoint.query}`;
  return `${scheme}://${endpoint.host}${port}${endpoint.path}${query}`;
};
