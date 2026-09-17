import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type DragEvent as ReactDragEvent,
} from 'react';
import { cx } from '../../lib/cx.js';
import { navigate } from '../../lib/router.js';
import { useFavorites } from '../../lib/useFavorites.js';
import { useSavedViews, openSavedView } from '../../lib/useSavedViews.js';
import { useDirectory } from '../../lib/directoryStore.js';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.js';
import { MultiSelect, type MultiSelectOption } from '../MultiSelect/MultiSelect.js';
import { NavItem } from '../NavItem/NavItem.js';
import { TextInput } from '../TextInput/TextInput.js';
import { Menu, type MenuEntry } from '../Menu/Menu.js';
import { Icon } from '../Icon/Icon.js';
import { Tree } from './Tree.js';
import styles from './Sidebar.module.css';

export interface SidebarNavItem {
  value: string;
  label: string;
  icon: string;
}

export interface SidebarProps {
  navItems: SidebarNavItem[];
  activeNav: string;
  onNavChange?: (value: string) => void;
  directoryLabel: string;
  /** Active directory-view segment (Flat/Tree/Favourites), derived from route. */
  view: string;
  onViewChange: (value: string) => void;
  className?: string;
}

const VIEW_OPTIONS = [
  { value: 'flat', label: 'Flat view', icon: 'BuildingOffice' },
  { value: 'tree', label: 'Tree view', icon: 'TreeView' },
  { value: 'favourites', label: 'Favourites', icon: 'Star' },
];

/** Directories available in the directory multi-select. */
const DIRECTORIES: MultiSelectOption[] = [
  {
    value: 'entra-1',
    title: 'Entra 1',
    subtitle: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
    icon: 'WindowsLogo',
  },
  {
    value: 'entra-2',
    title: 'Entra 2',
    subtitle: 'B2C3D4E5-F6A7-8901-BCDE-F23456789012',
    icon: 'WindowsLogo',
  },
  {
    value: 'ad-1',
    title: 'AD-1',
    subtitle: 'C3D4E5F6-A7B8-9012-CDEF-345678901234',
    icon: 'HardDrives',
  },
  {
    value: 'ad-2',
    title: 'AD-2',
    subtitle: 'D4E5F6A7-B8C9-0123-DEF0-456789012345',
    icon: 'HardDrives',
  },
  {
    value: 'entra-3',
    title: 'Entra 3',
    subtitle: 'E5F6A7B8-C9D0-1234-EF01-567890123456',
    icon: 'WindowsLogo',
  },
  {
    value: 'ad-3',
    title: 'AD-3',
    subtitle: 'F6A7B8C9-D0E1-2345-F012-678901234567',
    icon: 'HardDrives',
  },
  {
    value: 'ad-4',
    title: 'AD-4',
    subtitle: 'A7B8C9D0-E1F2-3456-0123-789012345678',
    icon: 'HardDrives',
  },
  {
    value: 'entra-4',
    title: 'Entra 4',
    subtitle: 'B8C9D0E1-F2A3-4567-1234-890123456789',
    icon: 'WindowsLogo',
  },
  {
    value: 'ad-5',
    title: 'AD-5',
    subtitle: 'C9D0E1F2-A3B4-5678-2345-901234567890',
    icon: 'HardDrives',
  },
];

/**
 * Sidebar — directory navigation rail.
 */
export function Sidebar({
  navItems,
  activeNav,
  onNavChange,
  directoryLabel,
  view,
  onViewChange,
  className,
}: SidebarProps) {
  const { selectedDirectories, setSelectedDirectories } = useDirectory();

  // Shared active indicator that slides between nav rows. NavItem's built-in
  // bar is suppressed (hideIndicator) so this single element can animate
  // between positions instead of the per-row bars hard-cutting.
  const navRef = useRef<HTMLElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const didPaintRef = useRef(false);

  const moveIndicator = (animate: boolean) => {
    const nav = navRef.current;
    const ind = indicatorRef.current;
    if (!nav || !ind) return;
    const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) {
      ind.style.height = '0px';
      return;
    }
    const write = () => {
      ind.style.transform = `translateY(${active.offsetTop}px)`;
      ind.style.height = `${active.offsetHeight}px`;
    };
    if (animate) {
      write();
    } else {
      const prev = ind.style.transition;
      ind.style.transition = 'none';
      write();
      void ind.offsetHeight;
      ind.style.transition = prev;
    }
  };

  useLayoutEffect(() => {
    moveIndicator(didPaintRef.current);
    didPaintRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNav, navItems]);

  useEffect(() => {
    const onResize = () => moveIndicator(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <aside className={cx(styles.sidebar, className)} aria-label="Directory">
      <div className={styles.viewSwitch}>
        <SegmentedControl
          items={VIEW_OPTIONS}
          value={view}
          onChange={onViewChange}
          ariaLabel="Directory view"
        />
      </div>

      {view === 'tree' ? (
        <Tree />
      ) : view === 'favourites' ? (
        <FavouritesBody />
      ) : (
        <>
          <div className={styles.selectBlock}>
            <MultiSelect
              label={directoryLabel}
              ariaLabel="Filter by directory"
              searchPlaceholder="Search directories"
              options={DIRECTORIES}
              selected={selectedDirectories}
              onSelectionChange={setSelectedDirectories}
              className={styles.directorySelect}
            />
          </div>

          <nav ref={navRef} className={styles.nav} aria-label="Directory entities">
            <span ref={indicatorRef} aria-hidden="true" className={styles.navIndicator} />
            {navItems.map((item) => (
              <NavItem
                key={item.value}
                icon={item.icon}
                label={item.label}
                selected={item.value === activeNav}
                hideIndicator
                onClick={() => onNavChange?.(item.value)}
              />
            ))}
          </nav>
        </>
      )}
    </aside>
  );
}

/** Which list a dragged row came from / is hovering over. */
type FavList = 'views' | 'objects';
interface DragPos {
  list: FavList;
  index: number;
}

/** Favourites segment body — search box + saved "Views" (named filter
 *  shortcuts) and favorited "Objects & folders", each reorderable via drag-and-drop
 *  (Figma node 4181:13907 / notes: "Favorites list in Directory panel",
 *  "Ordering by drag and drop"). Selecting the segment doesn't navigate —
 *  the main content stays on whatever page the user was already viewing. */
function FavouritesBody() {
  const { entries, remove: removeFavorite, reorder: reorderFavorites, rename: renameFavorite } = useFavorites();
  const { views, remove: removeView, reorder: reorderViews, rename: renameView } = useSavedViews();
  const [query, setQuery] = useState('');
  const [dragOver, setDragOver] = useState<DragPos | null>(null);
  const [contextMenu, setContextMenu] = useState<{ list: FavList; id: string; x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState<{ list: FavList; id: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const trimmed = query.trim().toLowerCase();
  const filteredViews = trimmed ? views.filter((v) => v.name.toLowerCase().includes(trimmed)) : views;
  const filteredEntries = trimmed ? entries.filter((f) => f.name.toLowerCase().includes(trimmed)) : entries;
  // Reordering needs a stable index into the *full* list — disabled while a
  // search filter is active so a filtered row's index can't be applied to
  // the wrong (unfiltered) position.
  const canReorder = trimmed.length === 0;

  // The drag source is read straight off the drop event's DataTransfer
  // rather than component state set by the earlier dragstart — state set in
  // one native drag event isn't guaranteed to have committed/re-rendered by
  // the time a later one fires, which made drops silently no-op.
  const handleDrop = (e: ReactDragEvent, list: FavList, dropIndex: number) => {
    const raw = e.dataTransfer.getData('application/x-favorite-drag');
    if (!raw) return;
    const source = JSON.parse(raw) as DragPos;
    if (source.list !== list || source.index === dropIndex) return;
    if (list === 'views') {
      const next = [...views];
      const [moved] = next.splice(source.index, 1);
      next.splice(dropIndex, 0, moved);
      reorderViews(next);
    } else {
      const next = [...entries];
      const [moved] = next.splice(source.index, 1);
      next.splice(dropIndex, 0, moved);
      reorderFavorites(next);
    }
  };
  const startDrag = (e: ReactDragEvent, list: FavList, index: number) => {
    e.dataTransfer.setData('application/x-favorite-drag', JSON.stringify({ list, index }));
    // Firefox refuses to start a drag at all without a plain-text fallback.
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.effectAllowed = 'move';
  };

  const openContextMenu = (e: ReactMouseEvent, list: FavList, id: string) => {
    e.preventDefault();
    // Keyboard-invoked context menus (ContextMenu key / Shift+F10) dispatch a
    // `contextmenu` event with clientX/clientY = 0 — anchor at the row's
    // bottom-left instead of the viewport corner.
    if (e.clientX === 0 && e.clientY === 0) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setContextMenu({ list, id, x: rect.left, y: rect.bottom });
      return;
    }
    setContextMenu({ list, id, x: e.clientX, y: e.clientY });
  };

  const startRename = (list: FavList, id: string, currentName: string) => {
    setRenaming({ list, id });
    setRenameValue(currentName);
  };
  const commitRename = () => {
    if (renaming) {
      const name = renameValue.trim();
      if (name) {
        if (renaming.list === 'views') renameView(renaming.id, name);
        else renameFavorite(renaming.id, name);
      }
    }
    setRenaming(null);
  };

  const contextMenuItems = useMemo<MenuEntry[]>(() => {
    if (!contextMenu) return [];
    const { list, id } = contextMenu;
    const item = list === 'views' ? views.find((v) => v.id === id) : entries.find((f) => f.id === id);
    if (!item) return [];
    return [
      {
        kind: 'item',
        label: 'Open',
        icon: 'Eye',
        onSelect: () => (list === 'views' ? openSavedView(item as (typeof views)[number]) : navigate((item as (typeof entries)[number]).href)),
      },
      { kind: 'item', label: 'Rename', icon: 'NotePencil', onSelect: () => startRename(list, id, item.name) },
      { kind: 'divider' },
      {
        kind: 'item',
        label: 'Remove from favorites',
        icon: 'Star',
        onSelect: () => (list === 'views' ? removeView(id) : removeFavorite(id)),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextMenu, views, entries]);

  const isEmpty = views.length === 0 && entries.length === 0;
  const noMatches = !isEmpty && filteredViews.length === 0 && filteredEntries.length === 0;

  return (
    <nav className={styles.nav} aria-label="Favourites">
      {!isEmpty && (
        <div className={styles.favSearch}>
          <TextInput
            iconLead="MagnifyingGlass"
            placeholder="Search by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search favourites"
          />
        </div>
      )}
      {isEmpty ? (
        <p className={styles.favEmpty}>
          <strong>No favorites yet.</strong> Add objects, directory folders or views to your Favorites for quick
          access.
        </p>
      ) : noMatches ? (
        <p className={styles.favEmpty}>No favourites match “{query.trim()}”.</p>
      ) : (
        <>
          {filteredViews.length > 0 && (
            <>
              <p className={styles.favSectionLabel}>Views</p>
              {filteredViews.map((v) => {
                const index = views.indexOf(v);
                return (
                  <FavRow
                    key={v.id}
                    icon="Star"
                    label={v.name}
                    badge={v.filterCount}
                    onSelect={() => openSavedView(v)}
                    onContextMenu={(e) => openContextMenu(e, 'views', v.id)}
                    draggable={canReorder}
                    onDragStart={(e) => startDrag(e, 'views', index)}
                    onDragOver={() => setDragOver({ list: 'views', index })}
                    onDrop={(e) => {
                      handleDrop(e, 'views', index);
                      setDragOver(null);
                    }}
                    onDragEnd={() => setDragOver(null)}
                    dragOver={dragOver?.list === 'views' && dragOver.index === index}
                    renaming={renaming?.list === 'views' && renaming.id === v.id}
                    renameValue={renameValue}
                    onRenameChange={setRenameValue}
                    onRenameCommit={commitRename}
                    onRenameCancel={() => setRenaming(null)}
                  />
                );
              })}
            </>
          )}
          {filteredEntries.length > 0 && (
            <>
              <p
                className={
                  filteredViews.length > 0
                    ? `${styles.favSectionLabel} ${styles.favSectionLabelSpaced}`
                    : styles.favSectionLabel
                }
              >
                Objects & folders
              </p>
              {filteredEntries.map((f) => {
                const index = entries.indexOf(f);
                return (
                  <FavRow
                    key={f.id}
                    icon={f.icon}
                    label={f.name}
                    onSelect={() => navigate(f.href)}
                    onContextMenu={(e) => openContextMenu(e, 'objects', f.id)}
                    draggable={canReorder}
                    onDragStart={(e) => startDrag(e, 'objects', index)}
                    onDragOver={() => setDragOver({ list: 'objects', index })}
                    onDrop={(e) => {
                      handleDrop(e, 'objects', index);
                      setDragOver(null);
                    }}
                    onDragEnd={() => setDragOver(null)}
                    dragOver={dragOver?.list === 'objects' && dragOver.index === index}
                    renaming={renaming?.list === 'objects' && renaming.id === f.id}
                    renameValue={renameValue}
                    onRenameChange={setRenameValue}
                    onRenameCommit={commitRename}
                    onRenameCancel={() => setRenaming(null)}
                  />
                );
              })}
            </>
          )}
        </>
      )}
      <Menu
        ariaLabel="Favourite item actions"
        items={contextMenuItems}
        open={contextMenu !== null}
        onOpenChange={(o) => {
          if (!o) setContextMenu(null);
        }}
        position={contextMenu ?? undefined}
      />
    </nav>
  );
}

/** Single draggable row shared by the Views and Objects sections — replaces
 *  `NavItem` here because it needs a trailing filter-count badge, a
 *  right-click context menu (Open/Rename/Remove), and inline rename. */
function FavRow({
  icon,
  label,
  badge,
  onSelect,
  onContextMenu,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  dragOver,
  renaming,
  renameValue,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
}: {
  icon: string;
  label: string;
  badge?: number;
  onSelect: () => void;
  onContextMenu: (e: ReactMouseEvent) => void;
  draggable: boolean;
  onDragStart: (e: ReactDragEvent) => void;
  onDragOver: () => void;
  onDrop: (e: ReactDragEvent) => void;
  onDragEnd: () => void;
  dragOver: boolean;
  renaming: boolean;
  renameValue: string;
  onRenameChange: (value: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
}) {
  return (
    <div
      className={cx(styles.favRow, dragOver && styles.favRowDragOver)}
      draggable={draggable && !renaming}
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(e);
      }}
      onDragEnd={onDragEnd}
      onContextMenu={onContextMenu}
    >
      {renaming ? (
        <span className={styles.favRowMain}>
          <span className={styles.favRowIcon} aria-hidden="true">
            <Icon name={icon} size="16px" />
          </span>
          <input
            autoFocus
            className={styles.favRowRenameInput}
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameCommit();
              if (e.key === 'Escape') onRenameCancel();
            }}
            onBlur={onRenameCommit}
            aria-label={`Rename ${label}`}
          />
        </span>
      ) : (
        <button type="button" className={styles.favRowMain} onClick={onSelect}>
          <span className={styles.favRowIcon} aria-hidden="true">
            <Icon name={icon} size="16px" />
          </span>
          <span className={styles.favRowLabel}>{label}</span>
        </button>
      )}
      {!!badge && (
        <span className={styles.favRowFilterIndicator}>
          <Icon name="FunnelSimple" size="16px" />
          <span className={styles.favRowBadge}>{badge}</span>
        </span>
      )}
    </div>
  );
}
