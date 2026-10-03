import type {
  AddItemInput,
  AddRequestsInput,
  CompareItem,
  ItemSelection,
  Panel,
} from "./items";
import type { Result } from "./result";

export type API = {
  listItems: (panel: Panel) => Promise<Result<CompareItem[]>>;
  addItem: (input: AddItemInput) => Promise<Result<CompareItem>>;
  addRequests: (input: AddRequestsInput) => Promise<Result<CompareItem[]>>;
  removeItems: (selection: ItemSelection) => Promise<Result<number[]>>;
  moveItems: (selection: ItemSelection) => Promise<Result<CompareItem[]>>;
  clearPanel: (panel: Panel) => Promise<Result<Panel>>;
};
