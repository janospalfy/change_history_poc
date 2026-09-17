import { useCallback, useSyncExternalStore } from 'react';
import { showToast } from './toastStore.js';
import { navigate } from './router.js';

/**
 * useFavorites — a global list of "favorited" directory objects, persisted to
 * localStorage and shared via a module-level store so every consumer (the
 * Favourites page, row menus) stays in sync without a provider.
 *
 * Stores lightweight entries (not bare ids) so the Favourites listing can
 * render + deep-link them without resolving against the lazy directory data.
 */

const STORAGE_KEY = 'ars.favorites';

export interface FavoriteEntry {
  id: string;
  name: string;
  /** Human label, e.g. an object-type label. */
  type: string;
  /** Icon name matching the object's type (see `OBJECT_TYPE_META`). */
  icon: string;
  description?: string;
  /** Hash route the row links to. */
  href: string;
}

/** Shown the first time the app runs (before the user has favorited
 *  anything), so the sidebar's Favourites panel isn't empty out of the box. */
const DEFAULT_FAVORITES: FavoriteEntry[] = [
  {
    id: 'isabella-clark',
    name: 'Isabella Clark',
    type: 'User',
    icon: 'User',
    description: 'Oversees enterprise-wide platform security strategy and operations.',
    href: '#/users/isabella-clark?tab=overview',
  },
  { id: 'page-users', name: 'Users', type: 'Page', icon: 'Users', href: '#/users' },
  { id: 'o1d-program-data', name: 'Program Data', type: 'Folder', icon: 'Folder', href: '#/tree/o1d-program-data' },
];

function read(): FavoriteEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Only the key's true absence (never persisted before) seeds the
    // defaults — an explicitly emptied list persists as "[]", not null.
    if (raw === null) return DEFAULT_FAVORITES;
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (e): e is FavoriteEntry =>
          !!e && typeof (e as FavoriteEntry).id === 'string' && typeof (e as FavoriteEntry).href === 'string',
      )
      // Entries saved before `icon` existed fall back to a generic star so
      // old localStorage data doesn't render with a blank icon slot.
      .map((e) => ({ ...e, icon: e.icon || 'Star' }));
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

export interface FavoritesApi {
  entries: FavoriteEntry[];
  isFavorite: (id: string) => boolean;
  /** Add if absent, remove if present. */
  toggle: (entry: FavoriteEntry) => void;
  remove: (id: string) => void;
  /** Replace the full list order (drag-and-drop reordering). */
  reorder: (nextOrder: FavoriteEntry[]) => void;
  rename: (id: string, name: string) => void;
}

export function useFavorites(): FavoritesApi {
  const entries = useSyncExternalStore(subscribe, () => current);

  const toggle = useCallback((entry: FavoriteEntry) => {
    const exists = current.some((e) => e.id === entry.id);
    if (exists) {
      current = current.filter((e) => e.id !== entry.id);
      persist();
      emit();
      // Matches Figma "Removed from Favorites" toast — no action buttons.
      showToast(`${entry.name} removed from Favorites.`);
    } else {
      current = [...current, entry];
      persist();
      emit();
      // Matches Figma "Added to Favorites" toast — Undo reverses it, View opens it.
      showToast(
        `${entry.name} added to Favorites.`,
        () => toggle(entry),
        undefined,
        'Undo',
        () => navigate(entry.href),
        'View',
      );
    }
  }, []);

  const remove = useCallback((id: string) => {
    const entry = current.find((e) => e.id === id);
    current = current.filter((e) => e.id !== id);
    persist();
    emit();
    if (entry) showToast(`${entry.name} removed from Favorites.`);
  }, []);

  const isFavorite = useCallback((id: string) => entries.some((e) => e.id === id), [entries]);

  const reorder = useCallback((nextOrder: FavoriteEntry[]) => {
    current = nextOrder;
    persist();
    emit();
  }, []);

  const rename = useCallback((id: string, name: string) => {
    current = current.map((e) => (e.id === id ? { ...e, name } : e));
    persist();
    emit();
  }, []);

  return { entries, isFavorite, toggle, remove, reorder, rename };
}
