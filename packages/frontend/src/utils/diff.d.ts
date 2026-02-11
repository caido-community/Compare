declare module "diff" {
  type Change = {
    value: string;
    added?: boolean;
    removed?: boolean;
  };
  export function diffWords(oldStr: string, newStr: string): Change[];
  export function diffChars(oldStr: string, newStr: string): Change[];
  export function diffLines(oldStr: string, newStr: string): Change[];
}
