type BackendErrorLike = {
  message?: string | null;
  code?: string | null;
  status?: number | null;
  name?: string | null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isRetryableBackendError = (error: BackendErrorLike | null | undefined) => {
  if (!error) return false;

  const message = `${error.message ?? ""}`.toLowerCase();
  return (
    error.code === "PGRST002" ||
    error.status === 503 ||
    message.includes("schema cache") ||
    message.includes("database error querying schema") ||
    message.includes("unexpected eof") ||
    message.includes("failed to fetch") ||
    message.includes("network request failed") ||
    message.includes("fetch failed")
  );
};

export async function retryBackendCall<T extends { error?: BackendErrorLike | null }>(
  operation: () => Promise<T>,
  attempts = 4,
  baseDelayMs = 350,
): Promise<T> {
  let lastResult: T | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const result = await operation();
      lastResult = result;

      if (!isRetryableBackendError(result.error) || attempt === attempts - 1) {
        return result;
      }
    } catch (error) {
      const normalizedError = error as BackendErrorLike;
      if (!isRetryableBackendError(normalizedError) || attempt === attempts - 1) {
        throw error;
      }
    }

    await sleep(baseDelayMs * (attempt + 1));
  }

  return lastResult as T;
}