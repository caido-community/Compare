export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

export class ComparisonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ComparisonError";
    Object.setPrototypeOf(this, ComparisonError.prototype);
  }
}
