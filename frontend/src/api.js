export const REQUEST_TIMEOUT_MS = 10000;

export async function request(url, options = {}) {
  const { signal, timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  let timer;
  let timedOut = false;
  const timeoutMessage = fetchOptions.method && fetchOptions.method.toUpperCase() !== "GET"
    ? `${fetchOptions.method.toUpperCase() === "DELETE" ? "Deleting" : "Saving"} timed out. Refresh the transaction list before retrying.`
    : "The request timed out. Please try again.";
  try {
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    });
    const response = (async () => {
      const isRead = !fetchOptions.method || fetchOptions.method.toUpperCase() === "GET";
      const result = await fetch(url, { ...(isRead ? { cache: "no-store" } : {}), ...fetchOptions, signal: controller.signal });
      if (result.status === 204 && result.ok) return null;
      let data;
      try { data = await result.json(); }
      catch { throw new Error("The service returned an unreadable response."); }
      if (!result.ok) throw new Error(typeof data?.error === "string" ? data.error : "The service could not complete this request.");
      return data;
    })();
    return await Promise.race([response, deadline]);
  } catch (error) {
    if (timedOut) throw new Error(timeoutMessage);
    if (error instanceof TypeError) throw new Error("Cannot connect to the local service. Please try again.");
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}
