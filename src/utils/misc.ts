/**
 * Custom js sleep function.
 * @param {number} timeInMs - time in ms.
 */
export const sleep = async (timeInMs: number) => {
  return new Promise(resolve => setTimeout(resolve, timeInMs));
}