import { useState } from 'react';
import { SegmentedToggle } from '../../../components/SegmentedToggle/SegmentedToggle.js';
import { TextInput } from '../../../components/TextInput/TextInput.js';
import { Button } from '../../../components/Button/Button.js';
import { IconButton } from '../../../components/IconButton/IconButton.js';
import { Tooltip } from '../../../components/Tooltip/Tooltip.js';
import styles from './HistoryTab.module.css';

const VIEW_ITEMS = [
  { value: 'changeHistory', label: 'Change History' },
  { value: 'userActivity', label: 'User Activity' },
];

/**
 * HistoryTab — the User Detail page's "History" tab. Hosts the Change
 * History / User Activity toggle, search + export + filter toolbar, and
 * (further down the audit) the grouped timeline and operation sidesheet.
 */
export function HistoryTab() {
  const [view, setView] = useState('changeHistory');
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <SegmentedToggle items={VIEW_ITEMS} value={view} onChange={setView} ariaLabel="History view" />
        <span className={styles.divider} aria-hidden="true" />
        <TextInput
          iconLead="MagnifyingGlass"
          placeholder="Search by operation name, ID etc."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search history"
          className={styles.search}
        />
        <Tooltip label={filtersOpen ? 'Hide filters' : 'Show filters'}>
          <IconButton
            icon="FunnelSimple"
            ariaLabel={filtersOpen ? 'Hide filters' : 'Show filters'}
            variant={filtersOpen ? 'secondary' : 'ghost'}
            aria-pressed={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          />
        </Tooltip>
        <Button iconLead="Export" variant="secondary">
          Export
        </Button>
      </div>

      {view === 'changeHistory' ? (
        <p className={styles.placeholder}>Filters and the operations timeline are coming next.</p>
      ) : (
        <p className={styles.placeholder}>Coming soon.</p>
      )}
    </div>
  );
}
