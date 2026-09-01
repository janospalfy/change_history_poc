import { useCallback, useSyncExternalStore } from 'react';

/**
 * toastStore — a global, app-wide transient toast message. Any code can call
 * `showToast(message)` (e.g. favourites toggles from row/detail menus); a
 * single `<Toast>` rendered in `App` subscribes and displays it.
 *
 * The `Toast` component owns its own auto-dismiss timer, so this store only
 * holds the current message and a `dismiss` to clear it.
 */

let current: ToastPayload | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export interface ToastPayload {
  message: string;
  /** Optional second line, e.g. Figma's two-line "Export successful" toast. */
  description?: string;
}

/** Show a toast from anywhere in the app. */
export function showToast(message: string, description?: string): void {
  current = { message, description };
  emit();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export interface ToastController {
  message: string | null;
  description?: string;
  dismiss: () => void;
}

export function useToastMessage(): ToastController {
  const payload = useSyncExternalStore(subscribe, () => current);
  const dismiss = useCallback(() => {
    current = null;
    emit();
  }, []);
  return { message: payload?.message ?? null, description: payload?.description, dismiss };
}
