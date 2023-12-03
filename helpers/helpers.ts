export function sleep(timeout: number): Promise<unknown> {
  return new Promise((resolve, _) => {
    setTimeout(() => resolve, timeout);
  });
}
