const isHighSurrogate = (code: number): boolean =>
  code >= 0xd800 && code <= 0xdbff;

const isLowSurrogate = (code: number): boolean =>
  code >= 0xdc00 && code <= 0xdfff;

const measureCodeUnit = (code: number): number => {
  if (code < 0x80) return 1;
  if (code < 0x800) return 2;
  return 3;
};

export const measureBytes = (text: string): number => {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (isHighSurrogate(code) && isLowSurrogate(text.charCodeAt(index + 1))) {
      bytes += 4;
      index += 1;
      continue;
    }
    bytes += measureCodeUnit(code);
  }
  return bytes;
};
