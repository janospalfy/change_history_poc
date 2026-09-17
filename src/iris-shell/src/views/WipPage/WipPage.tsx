import { type Ref } from 'react';
import { AppShell } from '../AppShell/AppShell.js';
import { ContentHeader } from '../../components/ContentHeader/ContentHeader.js';
import { IconButton } from '../../components/IconButton/IconButton.js';
import { Menu, type MenuEntry } from '../../components/Menu/Menu.js';
import { Tooltip } from '../../components/Tooltip/Tooltip.js';
import { useFavorites } from '../../lib/useFavorites.js';
import styles from './WipPage.module.css';

export interface WipPageProps {
  /** Heading text + breadcrumb leaf. */
  title: string;
  /** Glyph shown in the leading ResourceIcon tile. */
  icon: string;
  /** This page's route (e.g. '#/devices'), used as the favorite's id + link. */
  href: string;
}

/**
 * WipPage — placeholder for directory sections that don't have a real view
 * yet. Reuses the UsersPage header treatment (icon + title + page-actions
 * menu) and shows a "WIP" marker in the content area.
 */
export function WipPage({ title, icon, href }: WipPageProps) {
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const pageActionsMenuItems: MenuEntry[] = [
    { kind: 'item', label: 'Customize', icon: 'Pencil' },
    {
      kind: 'item',
      label: isFavorite(href) ? 'Remove from favourites' : 'Add page to favorites',
      icon: 'Star',
      onSelect: () => toggleFavorite({ id: href, name: title, type: 'Page', icon, href }),
    },
  ];

  return (
    <AppShell breadcrumb={[{ label: 'Directory Management' }, { label: title }]}>
      <ContentHeader
        icon={icon}
        title={title}
        actions={
          <Menu
            ariaLabel="Page actions"
            align="end"
            items={pageActionsMenuItems}
            trigger={({ ref, onClick, expanded }) => (
              <Tooltip label="More options">
                <IconButton
                  ref={ref as Ref<HTMLButtonElement>}
                  icon="DotsThree"
                  ariaLabel="Page actions"
                  aria-haspopup="menu"
                  aria-expanded={expanded}
                  onClick={onClick}
                />
              </Tooltip>
            )}
          />
        }
      />

      <div className={styles.wip}>
        <code className={styles.wipCode}>[WIP]</code>
      </div>
    </AppShell>
  );
}
