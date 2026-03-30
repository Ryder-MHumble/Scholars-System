import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * Lazy-load a route/page component and retry once on chunk-load failure by
 * forcing a full page reload. This avoids blank screens after deploys.
 */
export function lazyWithRetry<TProps extends object>(
  importer: () => Promise<{ default: ComponentType<TProps> }>,
  retryKey: string,
): LazyExoticComponent<ComponentType<TProps>> {
  return lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isChunkLoadError =
        message.includes("Failed to fetch dynamically imported module") ||
        message.includes("Importing a module script failed");

      if (isChunkLoadError) {
        const storageKey = `lazy-reload-once:${retryKey}`;
        const alreadyReloaded = window.sessionStorage.getItem(storageKey);
        if (!alreadyReloaded) {
          window.sessionStorage.setItem(storageKey, "1");
          window.location.reload();
          return new Promise<never>(() => {});
        }
        window.sessionStorage.removeItem(storageKey);
      }

      throw error;
    }
  });
}
