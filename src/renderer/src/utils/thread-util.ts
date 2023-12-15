// 线程等待
export const simulateThreadWait = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
