import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { showToast } from './toastStore.js';
import { navigate } from './router.js';
import type { AdvancedFilter } from './advancedSearchStore.js';

/**
 * useSavedViews — named shortcuts to a list page's current search + filter
 * state (e.g. "Users in My OU"), shown in the sidebar's Favourites "Views"
 * section above favorited "Objects". Persisted to localStorage and shared
 * via a module-level store, same pattern as `useFavorites`.
 */

const STORAGE_KEY = 'ars.savedViews';

/** Snapshot of the filter-relevant state a list page needs to restore itself. */
export interface SavedViewState {
  query: string;
  filters: AdvancedFilter[];
  /** Selected directory ids (see `useDirectory`). */
  directories: string[];
}

export interface SavedView {
  id: string;
  name: string;
  /** Base page route this view applies to (e.g. '#/users'). */
  route: string;
  /** Shown as a small badge next to the view in the sidebar. */
  filterCount: number;
  state: SavedViewState;
}

/** Shown the first time the app runs, so the sidebar's Favourites panel
 *  isn't empty out of the box. */
const DEFAULT_VIEWS: SavedView[] = [
  {
    id: 'seed-view-isabella',
    name: 'Isabella Clark search',
    route: '#/users',
    filterCount: 1,
    state: { query: 'Isabella', filters: [], directories: ['entra-1', 'entra-2', 'ad-1', 'ad-2'] },
  },
];

function read(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Only the key's true absence (never persisted before) seeds the
    // defaults — an explicitly emptied list persists as "[]", not null.
    if (raw === null) return DEFAULT_VIEWS;
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (v): v is SavedView =>
        !!v && typeof (v as SavedView).id === 'string' && typeof (v as SavedView).route === 'string',
    );
  } catch {
    return [];
  }
}

let current = read();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* storage unavailable — ignore */
  }
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** A view queued by `openSavedView`, picked up by whichever page instance
 *  owns the matching route via `useApplyPendingSavedView` — bridges the
 *  sidebar click (which only navigates) to that page's filter state. A
 *  small pub/sub (not just a plain variable) because navigating to a route
 *  you're already on doesn't remount the page or fire any React update, so
 *  a mount-only check would miss it; subscribers re-check on every queue. */
let pending: SavedView | null = null;
const pendingListeners = new Set<() => void>();

function emitPending() {
  for (const l of pendingListeners) l();
}

/** Navigates to the view's page and queues its filter state for pickup. */
export function openSavedView(view: SavedView) {
  pending = view;
  emitPending();
  navigate(view.route);
}

/** Call in a page component with its own route; applies a saved view's
 *  state (via `apply`) whenever one gets queued for that route — whether
 *  the page is mounting fresh (the normal cross-page navigation case) or is
 *  already mounted (the sidebar view was clicked while already on this page,
 *  which doesn't trigger a route change to mount from). */
export function useApplyPendingSavedView(route: string, apply: (state: SavedViewState) => void) {
  const applyRef = useRef(apply);
  applyRef.current = apply;

  useEffect(() => {
    const check = () => {
      if (pending && pending.route === route) {
        const state = pending.state;
        pending = null;
        applyRef.current(state);
      }
    };
    check();
    pendingListeners.add(check);
    return () => {
      pendingListeners.delete(check);
    };
  }, [route]);
}

export interface SavedViewsApi {
  views: SavedView[];
  save: (input: Omit<SavedView, 'id'>) => void;
  remove: (id: string) => void;
  /** Replace the full list order (drag-and-drop reordering). */
  reorder: (nextOrder: SavedView[]) => void;
  rename: (id: string, name: string) => void;
}

export function useSavedViews(): SavedViewsApi {
  const views = useSyncExternalStore(subscribe, () => current);

  const save = useCallback((input: Omit<SavedView, 'id'>) => {
    const view: SavedView = { id: `view-${Date.now()}`, ...input };
    current = [...current, view];
    persist();
    emit();
    // Matches Figma "Added to Favorites" toast — Undo reverses it, View opens it.
    showToast(
      `${view.name} added to Favorites.`,
      () => {
        current = current.filter((v) => v.id !== view.id);
        persist();
        emit();
      },
      undefined,
      'Undo',
      () => openSavedView(view),
      'View',
    );
  }, []);

  const remove = useCallback((id: string) => {
    const view = current.find((v) => v.id === id);
    current = current.filter((v) => v.id !== id);
    persist();
    emit();
    // Matches Figma "Removed from Favorites" toast — no action buttons.
    if (view) showToast(`${view.name} removed from Favorites.`);
  }, []);

  const rename = useCallback((id: string, name: string) => {
    current = current.map((v) => (v.id === id ? { ...v, name } : v));
    persist();
    emit();
  }, []);

  const reorder = useCallback((nextOrder: SavedView[]) => {
    current = nextOrder;
    persist();
    emit();
  }, []);

  return { views, save, remove, reorder, rename };
}
