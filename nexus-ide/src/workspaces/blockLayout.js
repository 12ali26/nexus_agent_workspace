export const defaultBlockSize = {
  width: 480,
  height: 300,
}

export function createBlockLayout(blockIndex) {
  const offset = 32 + blockIndex * 30

  return {
    position: {
      x: offset,
      y: offset,
    },
    size: defaultBlockSize,
  }
}
