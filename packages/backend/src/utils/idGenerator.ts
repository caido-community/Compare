import { CompareStore } from "../stores/compareStore";

export class IdGenerator {
  private static instance: IdGenerator;
  private currentId: number = 0;

  private constructor() {}

  static get(): IdGenerator {
    if (IdGenerator.instance === undefined) {
      IdGenerator.instance = new IdGenerator();
    }
    return IdGenerator.instance;
  }

  initialize(): void {
    const store = CompareStore.get();
    const panel1Items = store.getPanel1Items();
    const panel2Items = store.getPanel2Items();

    let maxId = 0;
    [...panel1Items, ...panel2Items].forEach((item) => {
      if (item.id > maxId) {
        maxId = item.id;
      }
    });

    this.currentId = maxId;
  }

  generateId(): number {
    this.currentId++;
    return this.currentId;
  }

  reset(): void {
    this.currentId = 0;
  }
}
