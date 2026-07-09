interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface InflightEntry<T> {
  promise: Promise<T>;
  controller: AbortController;
  activeConsumers: number;
}

type CachedFetchOptions = RequestInit & {
  ttl?: number;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_CACHE_TTL_MS = 60_000;

const requestCache = new Map<string, CacheEntry<unknown>>();
const inflightRequests = new Map<string, InflightEntry<unknown>>();

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === "AbortError"
  );
}

function createAbortError(): DOMException {
  return new DOMException("The operation was aborted.", "AbortError");
}

function releaseInflightConsumer<T>(entry: InflightEntry<T>): void {
  entry.activeConsumers = Math.max(0, entry.activeConsumers - 1);
  if (entry.activeConsumers === 0 && !entry.controller.signal.aborted) {
    entry.controller.abort();
  }
}

function withConsumerAbort<T>(
  promise: Promise<T>,
  entry: InflightEntry<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (signal?.aborted) {
    return Promise.reject(createAbortError());
  }

  entry.activeConsumers += 1;

  return new Promise<T>((resolve, reject) => {
    let released = false;
    const cleanup = () => {
      signal?.removeEventListener("abort", handleAbort);
      if (!released) {
        released = true;
        releaseInflightConsumer(entry);
      }
    };
    const handleAbort = () => {
      cleanup();
      reject(createAbortError());
    };

    signal?.addEventListener("abort", handleAbort, { once: true });
    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
  });
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const externalSignal = options.signal;
  let timedOut = false;

  const handleExternalAbort = () => {
    controller.abort();
  };

  if (externalSignal?.aborted) {
    controller.abort();
  } else {
    externalSignal?.addEventListener("abort", handleExternalAbort, {
      once: true,
    });
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    if (timedOut && isAbortError(error)) {
      throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", handleExternalAbort);
  }
}

export async function cachedFetch<T>(
  url: string,
  options: CachedFetchOptions = {},
): Promise<T> {
  const {
    ttl = DEFAULT_CACHE_TTL_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    ...fetchOptions
  } = options;
  const consumerSignal = signal ?? undefined;
  if (consumerSignal?.aborted) {
    return Promise.reject(createAbortError());
  }

  const cached = requestCache.get(url) as CacheEntry<T> | undefined;
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }

  const existing = inflightRequests.get(url) as InflightEntry<T> | undefined;
  if (existing && !existing.controller.signal.aborted) {
    return withConsumerAbort(existing.promise, existing, consumerSignal);
  }
  if (existing?.controller.signal.aborted) {
    inflightRequests.delete(url);
  }

  const controller = new AbortController();
  const promise = fetchWithTimeout(
    url,
    {
      ...fetchOptions,
      method: "GET",
      signal: controller.signal,
    },
    timeoutMs,
  )
    .then((res) => res.json() as Promise<T>)
    .then((data) => {
      requestCache.set(url, { data, timestamp: Date.now(), ttl });
      return data;
    })
    .finally(() => {
      inflightRequests.delete(url);
    });

  const entry: InflightEntry<T> = {
    promise,
    controller,
    activeConsumers: 0,
  };
  inflightRequests.set(url, entry);

  return withConsumerAbort(promise, entry, consumerSignal);
}

export function invalidateCache(pattern?: string | RegExp): void {
  if (!pattern) {
    requestCache.clear();
    for (const entry of inflightRequests.values()) {
      entry.controller.abort();
    }
    inflightRequests.clear();
    return;
  }

  for (const key of requestCache.keys()) {
    if (typeof pattern === "string" ? key.includes(pattern) : pattern.test(key)) {
      requestCache.delete(key);
    }
  }

  for (const [key, entry] of inflightRequests.entries()) {
    if (typeof pattern === "string" ? key.includes(pattern) : pattern.test(key)) {
      entry.controller.abort();
      inflightRequests.delete(key);
    }
  }
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}
