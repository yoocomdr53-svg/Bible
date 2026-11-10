// src/services/updateService.ts
// Real-time automatic version checking and service worker update controller
// Supports PC (Windows Chrome/Edge desktop PWA) and mobile (Android/iOS)

import { APP_VERSION } from '../version';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  serverVersion?: string;
  currentVersion: string;
}

let isUpdating = false;

// Check server for newer version via version.json
export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  if (typeof window === 'undefined') {
    return { hasUpdate: false, currentVersion: APP_VERSION };
  }

  try {
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (!res.ok) {
      return { hasUpdate: false, currentVersion: APP_VERSION };
    }

    const data = await res.json();
    const serverVer = data.version;

    if (serverVer && serverVer !== APP_VERSION) {
      console.log(`[SuperBible Update] New version detected: ${serverVer} (Current: ${APP_VERSION})`);
      window.dispatchEvent(
        new CustomEvent('superbible_update_available', {
          detail: { serverVersion: serverVer, currentVersion: APP_VERSION },
        })
      );
      return { hasUpdate: true, serverVersion: serverVer, currentVersion: APP_VERSION };
    }

    return { hasUpdate: false, serverVersion: serverVer, currentVersion: APP_VERSION };
  } catch (e) {
    console.warn('[SuperBible Update] Version check skipped:', e);
    return { hasUpdate: false, currentVersion: APP_VERSION };
  }
}

// Force clean caches, unregister service workers and hard reload to latest version
export async function forceAppUpdate(): Promise<void> {
  if (isUpdating) return;
  isUpdating = true;

  try {
    // 1. Clear all CacheStorage
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    // 2. Clear old Service Workers
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (e) {
    console.error('[SuperBible Update] Cleanup error:', e);
  }

  // 3. Hard reload to latest origin
  const cleanUrl = `${window.location.origin}${window.location.pathname}?v=${Date.now()}`;
  window.location.href = cleanUrl;
}

// Automatically apply update with user toast feedback
export async function applyAppUpdate(newVersion?: string): Promise<void> {
  if (isUpdating) return;
  isUpdating = true;

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        await reg.update();
      }
    }
  } catch (e) {
    // continue to reload
  }

  setTimeout(() => {
    window.location.reload();
  }, 1200);
}

// Initialize real-time auto update service for PC desktop PWA and mobile
export function initAutoUpdateService(
  onUpdateDetected?: (newVersion: string) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  let activeRegistration: ServiceWorkerRegistration | null = null;
  let hasTriggeredReload = false;

  // 1. Register Service Worker with active update listening
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        activeRegistration = reg;

        // Force check immediately on startup
        reg.update().catch(() => {});

        // Listen for new worker installed in waiting state
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (installing) {
            installing.addEventListener('statechange', () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SuperBible] New ServiceWorker installed, activating...');
                installing.postMessage({ type: 'SKIP_WAITING' });
                if (onUpdateDetected) onUpdateDetected('최신 버전');
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[SuperBible] SW registration notice:', err);
      });

    // Auto reload when new controller takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hasTriggeredReload) {
        hasTriggeredReload = true;
        console.log('[SuperBible] Controller updated, refreshing page...');
        window.location.reload();
      }
    });
  }

  // 2. Routine version check function
  const triggerRoutineCheck = async () => {
    if (activeRegistration) {
      activeRegistration.update().catch(() => {});
    }
    const check = await checkForAppUpdate();
    if (check.hasUpdate && check.serverVersion) {
      if (onUpdateDetected) {
        onUpdateDetected(check.serverVersion);
      }
      applyAppUpdate(check.serverVersion);
    }
  };

  // Run on initial startup
  triggerRoutineCheck();

  // 3. Check when user switches to PC PWA window (focus / visibility)
  const handleFocus = () => triggerRoutineCheck();
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      triggerRoutineCheck();
    }
  };

  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // 4. Background periodic check every 30 seconds
  const intervalId = window.setInterval(triggerRoutineCheck, 30000);

  // Cleanup handler
  return () => {
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.clearInterval(intervalId);
  };
}
