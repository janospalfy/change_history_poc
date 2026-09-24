import { useEffect, useState } from 'react';

/**
 * Tiny hash-based router for the PoC. No deps.
 *
 *   parseHash('#/users/abc')        -> { name: 'userDetail', params: { id: 'abc' } }
 *   parseHash('#/users')            -> { name: 'usersList',  params: {} }
 *   anything else                    -> { name: 'usersList', params: {} }
 *
 * To navigate: `navigate('#/users/abc')`. Components subscribe via `useRoute()`.
 */

export type Route =
  | { name: 'userDetail'; params: { id: string; tab?: string; op?: string; export?: string; filters?: string } }
  | { name: 'usersList'; params: Record<string, never> }
  | { name: 'treeRoot'; params: Record<string, never> }
  | { name: 'treeList'; params: { nodeId: string } }
  | { name: 'treeDetail'; params: { nodeId: string; objectId: string; tab?: string; op?: string; export?: string } }
  | { name: 'favoritesLink'; params: Record<string, never> }
  | { name: 'groups'; params: Record<string, never> }
  | { name: 'groupDetail'; params: { id: string; tab?: string } }
  | { name: 'devices'; params: Record<string, never> }
  | { name: 'agents'; params: Record<string, never> }
  | { name: 'applications'; params: Record<string, never> }
  | { name: 'accessTemplates'; params: Record<string, never> }
  | { name: 'managementUnits'; params: Record<string, never> }
  | { name: 'insights'; params: Record<string, never> }
  | { name: 'services'; params: Record<string, never> }
  | { name: 'identityHome'; params: Record<string, never> }
  | { name: 'safeguardHome'; params: Record<string, never> };

export type RouteName = Route['name'];

interface RouteDef {
  name: RouteName;
  pathPattern: RegExp;
  keys: string[];
  /** Optional query-string params (e.g. `?tab=history&op=ID:1-4098`) — read
   *  independently of path params and of each other's order. */
  queryKeys?: string[];
}

const ROUTES: RouteDef[] = [
  { name: 'userDetail', pathPattern: /^#\/users\/([^/]+)$/, keys: ['id'], queryKeys: ['tab', 'op', 'export', 'filters'] },
  { name: 'usersList', pathPattern: /^#\/users$/, keys: [] },
  { name: 'treeDetail', pathPattern: /^#\/tree\/([^/]+)\/([^/]+)$/, keys: ['nodeId', 'objectId'], queryKeys: ['tab', 'op', 'export'] },
  { name: 'treeList', pathPattern: /^#\/tree\/([^/]+)$/, keys: ['nodeId'] },
  { name: 'treeRoot', pathPattern: /^#\/tree$/, keys: [] },
  { name: 'favoritesLink', pathPattern: /^#\/favorites$/, keys: [] },
  { name: 'groups', pathPattern: /^#\/groups$/, keys: [] },
  { name: 'groupDetail', pathPattern: /^#\/groups\/([^/]+)$/, keys: ['id'], queryKeys: ['tab'] },
  { name: 'devices', pathPattern: /^#\/devices$/, keys: [] },
  { name: 'agents', pathPattern: /^#\/agents$/, keys: [] },
  { name: 'applications', pathPattern: /^#\/applications$/, keys: [] },
  { name: 'accessTemplates', pathPattern: /^#\/access-templates$/, keys: [] },
  { name: 'managementUnits', pathPattern: /^#\/management-units$/, keys: [] },
  { name: 'insights', pathPattern: /^#\/insights$/, keys: [] },
  { name: 'services', pathPattern: /^#\/services$/, keys: [] },
  { name: 'identityHome', pathPattern: /^#\/identity$/, keys: [] },
  { name: 'safeguardHome', pathPattern: /^#\/safeguard$/, keys: [] },
];

const DEFAULT = '#/insights';

function parseHash(hash: string | null | undefined): Route {
  const h = hash || DEFAULT;
  const queryIndex = h.indexOf('?');
  const path = queryIndex === -1 ? h : h.slice(0, queryIndex);
  const query = new URLSearchParams(queryIndex === -1 ? '' : h.slice(queryIndex + 1));
  for (const r of ROUTES) {
    const m = path.match(r.pathPattern);
    if (m) {
      const params: Record<string, string> = {};
      r.keys.forEach((k, i) => {
        params[k] = decodeURIComponent(m[i + 1]);
      });
      r.queryKeys?.forEach((k) => {
        const v = query.get(k);
        if (v !== null) params[k] = v;
      });
      return { name: r.name, params } as Route;
    }
  }
  return { name: 'usersList', params: {} };
}


/**
 * Programmatic navigation. Updates the URL hash (and triggers `hashchange`
 * which `useRoute` listens to).
 */
export function navigate(path: string): void {
  if (typeof window === 'undefined') return;
  if (window.location.hash === path) return;
  window.location.hash = path;
  // Always scroll to top on route change for a real-page-navigation feel.
  window.scrollTo(0, 0);
}

/**
 * Swap in a new URL (e.g. to reflect the active tab) without pushing a new
 * history entry or scrolling — unlike `navigate`, this is for in-place UI
 * state that should be shareable/bookmarkable but shouldn't spam the
 * back-button history on every click (tab switches, etc).
 */
export function navigateReplace(path: string): void {
  if (typeof window === 'undefined') return;
  if (window.location.hash === path) return;
  window.history.replaceState(null, '', path);
}

/**
 * useRoute — returns the currently active route.
 */
function normalizeAddressBar(): void {
  if (typeof window === 'undefined') return;
  if (!window.location.hash) {
    window.history.replaceState(null, '', DEFAULT);
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === 'undefined'
      ? { name: 'usersList', params: {} }
      : parseHash(window.location.hash),
  );

  useEffect(() => {
    const onHashChange = () => {
      // Re-normalize whenever the hash is cleared (e.g. user edits the URL).
      normalizeAddressBar();
      setRoute(parseHash(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    normalizeAddressBar();
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}
