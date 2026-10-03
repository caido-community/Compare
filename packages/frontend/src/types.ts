import { type Caido } from "@caido/sdk-frontend";
import { type CompareItem, type Panel, type Spec } from "shared";

import { type DiffResult } from "@/utils/diff";

export type FrontendSDK = Caido<Spec>;

export type DiffView = Record<Panel, CompareItem> & { result: DiffResult };
