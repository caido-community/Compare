import { type CompareItem } from "../types";

export class CompareStore {
  private static instance: CompareStore;

  private panel1Items: Map<number, CompareItem>;
  private panel2Items: Map<number, CompareItem>;

  private constructor() {
    this.panel1Items = new Map();
    this.panel2Items = new Map();
  }

  static get(): CompareStore {
    if (CompareStore.instance === undefined) {
      CompareStore.instance = new CompareStore();
    }
    return CompareStore.instance;
  }

  // Panel 1 Operations
  getPanel1Items(): CompareItem[] {
    return [...this.panel1Items.values()].sort((a, b) => a.id - b.id);
  }

  getPanel1Item(id: number): CompareItem | undefined {
    return this.panel1Items.get(id);
  }

  addPanel1Item(item: CompareItem): void {
    this.panel1Items.set(item.id, item);
  }

  deletePanel1Item(id: number): boolean {
    return this.panel1Items.delete(id);
  }

  clearPanel1(): void {
    this.panel1Items.clear();
  }

  // Panel 2 Operations
  getPanel2Items(): CompareItem[] {
    return [...this.panel2Items.values()].sort((a, b) => a.id - b.id);
  }

  getPanel2Item(id: number): CompareItem | undefined {
    return this.panel2Items.get(id);
  }

  addPanel2Item(item: CompareItem): void {
    this.panel2Items.set(item.id, item);
  }

  deletePanel2Item(id: number): boolean {
    return this.panel2Items.delete(id);
  }

  clearPanel2(): void {
    this.panel2Items.clear();
  }

  getPanelItems(panelNumber: 1 | 2): CompareItem[] {
    return panelNumber === 1 ? this.getPanel1Items() : this.getPanel2Items();
  }

  getPanelItem(panelNumber: 1 | 2, id: number): CompareItem | undefined {
    return panelNumber === 1 ? this.getPanel1Item(id) : this.getPanel2Item(id);
  }

  addPanelItem(panelNumber: 1 | 2, item: CompareItem): void {
    if (panelNumber === 1) {
      this.addPanel1Item(item);
    } else {
      this.addPanel2Item(item);
    }
  }

  deletePanelItem(panelNumber: 1 | 2, id: number): boolean {
    return panelNumber === 1
      ? this.deletePanel1Item(id)
      : this.deletePanel2Item(id);
  }

  clearPanel(panelNumber: 1 | 2): void {
    if (panelNumber === 1) {
      this.clearPanel1();
    } else {
      this.clearPanel2();
    }
  }

  getStats() {
    return {
      panel1Count: this.panel1Items.size,
      panel2Count: this.panel2Items.size,
      totalItems: this.panel1Items.size + this.panel2Items.size,
    };
  }

  loadPanel1Items(items: CompareItem[]): void {
    this.panel1Items.clear();
    items.forEach((item) => this.panel1Items.set(item.id, item));
  }

  loadPanel2Items(items: CompareItem[]): void {
    this.panel2Items.clear();
    items.forEach((item) => this.panel2Items.set(item.id, item));
  }

  loadPanelItems(panelNumber: 1 | 2, items: CompareItem[]): void {
    if (panelNumber === 1) {
      this.loadPanel1Items(items);
    } else {
      this.loadPanel2Items(items);
    }
  }
}
