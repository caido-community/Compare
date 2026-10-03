const HIGH_SURROGATE_START = 0xd800;

const HIGH_SURROGATE_END = 0xdbff;

const measureCodeUnit = (code: number): number => {
  if (code < 0x80) return 1;
  if (code < 0x800) return 2;
  return 3;
};

export const measureBytes = (text: string): number => {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    const isSurrogatePair =
      code >= HIGH_SURROGATE_START && code <= HIGH_SURROGATE_END;
    bytes += isSurrogatePair ? 4 : measureCodeUnit(code);
    index += isSurrogatePair ? 1 : 0;
  }
  return bytes;
};
