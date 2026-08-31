import { useMemo, useRef, useState, type Ref } from 'react';
import { cx } from '../../../lib/cx.js';
import { SegmentedToggle } from '../../../components/SegmentedToggle/SegmentedToggle.js';
import { TextInput } from '../../../components/TextInput/TextInput.js';
import { Button } from '../../../components/Button/Button.js';
import { IconButton } from '../../../components/IconButton/IconButton.js';
import { Tooltip } from '../../../components/Tooltip/Tooltip.js';
import { Menu } from '../../../components/Menu/Menu.js';
import { Icon } from '../../../components/Icon/Icon.js';
import {
  Filters,
  fieldHasValueUi,
  type ActiveFilter,
  type FilterFieldConfig,
} from '../../../components/Filters/Filters.js';
import { Timeline } from './Timeline.js';
import { OperationDetailSidesheet } from './OperationDetailSidesheet.js';
import {
  MOCK_CHANGE_HISTORY,
  MOCK_USER_ACTIVITY,
  type ChangeHistoryGroup,
  type ChangeHistoryOperation,
  type OperationType,
} from './mockChangeHistory.js';
import styles from './HistoryTab.module.css';

const VIEW_ITEMS = [
  { value: 'changeHistory', label: 'Change History' },
  { value: 'userActivity', label: 'User Activity' },
];

/** A native date input with the browser's calendar icon replaced by the
 *  Iris `CalendarBlank` glyph (the native icon is kept, just made
 *  invisible, so its click target still opens the native picker). */
function DateValueInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <span className={styles.dateInputWrapper}>
      <input
        type="datetime-local"
        className={cx(styles.dateFilterSegment, styles.dateFilterValueSegment, styles.dateInput)}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <Icon name="CalendarBlank" size="12px" className={styles.dateInputIcon} />
    </span>
  );
}

/** Operation-type filter chips shown in the filter strip. Dot colours are
 *  fixed per type, matching the Figma design (not user-configurable). Each
 *  chip is a broad bucket covering one or more granular operation types. */
const OPERATION_TYPES = [
  { value: 'create', label: 'Create', dotClassName: 'dotCreate', selectedClassName: 'typeChipCreateSelected' },
  { value: 'edit', label: 'Edit', dotClassName: 'dotEdit', selectedClassName: 'typeChipEditSelected' },
  { value: 'remove', label: 'Remove', dotClassName: 'dotRemove', selectedClassName: 'typeChipRemoveSelected' },
  {
    value: 'deprovision',
    label: 'Deprovision',
    dotClassName: 'dotDeprovision',
    selectedClassName: 'typeChipDeprovisionSelected',
  },
] as const;

/** Maps each granular operation type to the filter chip bucket it belongs to. */
const BUCKET_BY_TYPE: Record<OperationType, (typeof OPERATION_TYPES)[number]['value']> = {
  created: 'create',
  changeUser: 'edit',
  renamed: 'edit',
  moved: 'edit',
  groupMembershipChange: 'edit',
  deprovision: 'deprovision',
  undoDeprovision: 'deprovision',
  deleted: 'remove',
};

/** Reads the value a given property-filter field targets on an operation. */
function getFieldValue(op: ChangeHistoryOperation, fieldId: string): string {
  switch (fieldId) {
    case 'name':
      return op.name;
    case 'reason':
      return op.reason;
    case 'operationId':
      return op.id.replace(/^ID:\s*/, '');
    case 'requestedBy':
      return op.actor;
    case 'status':
      return op.status;
    case 'logonComputer':
      return op.logonComputer;
    case 'logonSite':
      return op.logonSite;
    case 'activeRolesAdmin':
      return op.activeRolesAdmin;
    case 'targetObject':
      return op.targetObject;
    case 'lastUpdatedOn':
      return op.lastUpdatedOn;
    default:
      return '';
  }
}

/** Builds `{value, label}` options from every distinct value present in a
 *  given operation list for a given field — keeps the "Add filter" menu
 *  functional without inventing data that isn't already on the operation. */
function uniqueOptions(operations: ChangeHistoryOperation[], fieldId: string): { value: string; label: string }[] {
  const seen = new Set<string>();
  const options: { value: string; label: string }[] = [];
  for (const op of operations) {
    const value = getFieldValue(op, fieldId);
    if (value && !seen.has(value)) {
      seen.add(value);
      options.push({ value, label: value });
    }
  }
  return options;
}

/** The generic "Add filter" field list, matching the Figma Add-filter menu
 *  exactly (node 1492:22341). Options are derived from real mock data. */
/** "Is in the last" value options, matching the Figma date filter tag's
 *  value dropdown exactly (node 1487:26333, state 3). Relative to the
 *  newest mock operation's date (not the real "today") so demo data has
 *  matches. */
const DATE_RELATIVE_OPTIONS = [
  { id: 'last7', label: '7 days', days: 7 },
  { id: 'last14', label: '14 days', days: 14 },
  { id: 'last30', label: '30 days', days: 30 },
  { id: 'last90', label: '90 days', days: 90 },
  { id: 'last365', label: '12 months', days: 365 },
] as const;

/** The date filter tag's condition/rule options, matching the Figma
 *  condition dropdown exactly (node 1487:26333, state 4). */
type DateRule = 'relative' | 'between' | 'before' | 'after' | 'exactly';
const DATE_RULE_LABELS: Record<DateRule, string> = {
  relative: 'is in the last',
  between: 'is between',
  before: 'is before',
  after: 'is after',
  exactly: 'is',
};

/** yyyy-MM-DDTHH:mm (local time), used as the default value for the
 *  before/after/exactly/between date-time inputs. */
function toDatetimeLocal(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Everything derived from a single operations list (dataset-dependent, so
 *  Change History and User Activity each get their own). */
function buildDatasetContext(dataset: ChangeHistoryGroup[]) {
  const allOperations = dataset.flatMap((group) => group.operations);
  const latestDate = allOperations.reduce((latest, op) => Math.max(latest, new Date(op.date).getTime()), 0);
  const filterFields: FilterFieldConfig[] = [
    { id: 'name', label: 'Name', options: uniqueOptions(allOperations, 'name') },
    { id: 'reason', label: 'Reason', options: uniqueOptions(allOperations, 'reason') },
    { id: 'operationId', label: 'Operation ID', options: uniqueOptions(allOperations, 'operationId') },
    { id: 'requestedBy', label: 'Requested by', options: uniqueOptions(allOperations, 'requestedBy') },
    { id: 'status', label: 'Status', options: uniqueOptions(allOperations, 'status') },
    { id: 'logonComputer', label: 'Logon computer', options: uniqueOptions(allOperations, 'logonComputer') },
    { id: 'logonSite', label: 'Logon site', options: uniqueOptions(allOperations, 'logonSite') },
    {
      id: 'activeRolesAdmin',
      label: 'Active Roles Admin',
      options: uniqueOptions(allOperations, 'activeRolesAdmin'),
    },
    { id: 'targetObject', label: 'Target object', options: uniqueOptions(allOperations, 'targetObject') },
    { id: 'lastUpdatedOn', label: 'Last updated on', options: uniqueOptions(allOperations, 'lastUpdatedOn') },
  ];
  return { allOperations, latestDate, latestDateInput: toDatetimeLocal(latestDate), filterFields };
}

/**
 * HistoryTab — the User Detail page's "History" tab. Hosts the Change
 * History / User Activity toggle, search + export + filter toolbar, and
 * (further down the audit) the grouped timeline and operation sidesheet.
 */
export function HistoryTab() {
  const [view, setView] = useState('changeHistory');
  const [query, setQuery] = useState('');
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [dateRule, setDateRule] = useState<DateRule | null>(null);
  const [dateRelativeId, setDateRelativeId] = useState<(typeof DATE_RELATIVE_OPTIONS)[number]['id']>('last30');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOpId, setSelectedOpId] = useState<string | null>(null);
  const filterIdRef = useRef(0);

  const activeDataset = view === 'changeHistory' ? MOCK_CHANGE_HISTORY : MOCK_USER_ACTIVITY;
  const { allOperations, latestDate, latestDateInput, filterFields } = useMemo(
    () => buildDatasetContext(activeDataset),
    [activeDataset],
  );

  // Switching views swaps the whole dataset out from under any active
  // filters, so reset them rather than leaving stale/mismatched selections.
  const prevView = useRef(view);
  if (prevView.current !== view) {
    prevView.current = view;
    setActiveTypes([]);
    setActiveFilters([]);
    setDateRule(null);
    setDateFrom(latestDateInput);
    setDateTo(latestDateInput);
    setSelectedOpId(null);
  }
  if (dateFrom === '' && dateTo === '') {
    setDateFrom(latestDateInput);
    setDateTo(latestDateInput);
  }

  const selectedIndex = allOperations.findIndex((op) => op.id === selectedOpId);
  const selectedOperation: ChangeHistoryOperation | null =
    selectedIndex >= 0 ? allOperations[selectedIndex] : null;

  const trimmedQuery = query.trim().toLowerCase();
  const hasActiveFilters =
    trimmedQuery.length > 0 || activeTypes.length > 0 || activeFilters.length > 0 || dateRule !== null;
  const fromTime = dateFrom ? new Date(dateFrom).getTime() : null;
  const toTime = dateTo ? new Date(dateTo).getTime() : null;
  const relativeCutoff =
    latestDate - (DATE_RELATIVE_OPTIONS.find((f) => f.id === dateRelativeId)?.days ?? 0) * 86_400_000;
  const filteredGroups = useMemo(() => {
    return activeDataset.map((group) => ({
      ...group,
      operations: group.operations.filter((op) => {
        const matchesQuery =
          !trimmedQuery ||
          op.label.toLowerCase().includes(trimmedQuery) ||
          op.id.toLowerCase().includes(trimmedQuery);
        const matchesType = activeTypes.length === 0 || activeTypes.includes(BUCKET_BY_TYPE[op.type]);
        const matchesFilters = activeFilters.every(
          (filter) => !filter.value || getFieldValue(op, filter.fieldId) === filter.value,
        );
        const opTime = new Date(op.date).getTime();
        let matchesDate = true;
        if (dateRule === 'relative') matchesDate = opTime >= relativeCutoff;
        else if (dateRule === 'before') matchesDate = fromTime !== null && opTime < fromTime;
        else if (dateRule === 'after') matchesDate = fromTime !== null && opTime > fromTime;
        else if (dateRule === 'exactly') matchesDate = fromTime !== null && opTime === fromTime;
        else if (dateRule === 'between')
          matchesDate = fromTime !== null && toTime !== null && opTime >= fromTime && opTime <= toTime;
        return matchesQuery && matchesType && matchesFilters && matchesDate;
      }),
    })).filter((group) => group.operations.length > 0);
  }, [activeDataset, trimmedQuery, activeTypes, activeFilters, dateRule, relativeCutoff, fromTime, toTime]);

  const toggleType = (value: string) => {
    setActiveTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const addFilter = (fieldId: string) => {
    filterIdRef.current += 1;
    setActiveFilters((prev) => [...prev, { id: `hf${filterIdRef.current}`, fieldId }]);
  };
  const setFilterValue = (id: string, value: string) =>
    setActiveFilters((prev) => prev.map((f) => (f.id === id ? { ...f, value } : f)));
  const removeFilter = (id: string) => setActiveFilters((prev) => prev.filter((f) => f.id !== id));
  const clearFilters = () => setActiveFilters([]);

  const addFilterMenuItems = filterFields.map((field) => {
    const supported = fieldHasValueUi(field);
    return {
      kind: 'item' as const,
      label: field.label,
      disabled: !supported,
      onSelect: supported ? () => addFilter(field.id) : undefined,
    };
  });

  const dateMenuItems = [
    { kind: 'item' as const, label: 'All time', selected: dateRule === null, onSelect: () => setDateRule(null) },
    { kind: 'divider' as const },
    {
      kind: 'submenu' as const,
      label: 'Is in the last',
      items: DATE_RELATIVE_OPTIONS.map((opt) => ({
        kind: 'item' as const,
        label: opt.label,
        selected: dateRule === 'relative' && dateRelativeId === opt.id,
        onSelect: () => {
          setDateRule('relative');
          setDateRelativeId(opt.id);
        },
      })),
    },
    { kind: 'item' as const, label: 'Is between', selected: dateRule === 'between', onSelect: () => setDateRule('between') },
    { kind: 'item' as const, label: 'Is before', selected: dateRule === 'before', onSelect: () => setDateRule('before') },
    { kind: 'item' as const, label: 'Is after', selected: dateRule === 'after', onSelect: () => setDateRule('after') },
    { kind: 'item' as const, label: 'Is', selected: dateRule === 'exactly', onSelect: () => setDateRule('exactly') },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <SegmentedToggle items={VIEW_ITEMS} value={view} onChange={setView} ariaLabel="History view" />
        <span className={styles.divider} aria-hidden="true" />
        <TextInput
          iconLead="MagnifyingGlass"
          placeholder="Search by operation name or ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search history"
          className={styles.search}
        />
        <Menu
          ariaLabel="Add filter"
          align="start"
          items={addFilterMenuItems}
          trigger={({ ref, onClick, expanded }) => (
            <Tooltip label="Add filter">
              <IconButton
                ref={ref as Ref<HTMLButtonElement>}
                icon="FunnelSimple"
                ariaLabel="Add filter"
                variant="secondary"
                aria-haspopup="menu"
                aria-expanded={expanded}
                className={activeFilters.length > 0 ? styles.filterButtonActive : undefined}
                onClick={onClick}
              />
            </Tooltip>
          )}
        />
        <Button iconLead="Export" variant="secondary">
          Export
        </Button>
      </div>

      <>
        <div className={styles.filterStrip} role="group" aria-label="Filter by operation type">
            <span className={styles.quickFiltersLabel}>Quick filters</span>
            <button
              type="button"
              className={cx(
                styles.typeChip,
                styles.allChip,
                activeTypes.length === 0 && cx(styles.typeChipSelected, styles.allChipSelected),
              )}
              aria-pressed={activeTypes.length === 0}
              onClick={() => setActiveTypes([])}
            >
              All
            </button>
            {OPERATION_TYPES.map((type) => {
              const selected = activeTypes.includes(type.value);
              return (
                <button
                  key={type.value}
                  type="button"
                  className={cx(
                    styles.typeChip,
                    selected && cx(styles.typeChipSelected, styles[type.selectedClassName]),
                  )}
                  aria-pressed={selected}
                  onClick={() => toggleType(type.value)}
                >
                  <span className={cx(styles.dot, styles[type.dotClassName])} aria-hidden="true" />
                  {type.label}
                </button>
              );
            })}
            <div className={cx(styles.dateFilterTag, dateRule !== null && styles.dateFilterTagActive)}>
              <Menu
                ariaLabel="Filter by date"
                align="start"
                items={dateMenuItems}
                trigger={({ ref, onClick, expanded }) => (
                  <button
                    ref={ref as Ref<HTMLButtonElement>}
                    type="button"
                    className={styles.dateFilterSegment}
                    aria-haspopup="menu"
                    aria-expanded={expanded}
                    onClick={onClick}
                  >
                    Date
                    <span className={styles.dateFilterRule}>{dateRule !== null ? DATE_RULE_LABELS[dateRule] : 'All time'}</span>
                  </button>
                )}
              />
              {dateRule === 'relative' && (
                <Menu
                  ariaLabel="Relative date value"
                  align="start"
                  items={DATE_RELATIVE_OPTIONS.map((opt) => ({
                    kind: 'item' as const,
                    label: opt.label,
                    selected: dateRelativeId === opt.id,
                    onSelect: () => setDateRelativeId(opt.id),
                  }))}
                  trigger={({ ref, onClick, expanded }) => (
                    <button
                      ref={ref as Ref<HTMLButtonElement>}
                      type="button"
                      className={cx(styles.dateFilterSegment, styles.dateFilterValueSegment)}
                      aria-haspopup="menu"
                      aria-expanded={expanded}
                      onClick={onClick}
                    >
                      {DATE_RELATIVE_OPTIONS.find((opt) => opt.id === dateRelativeId)?.label}
                    </button>
                  )}
                />
              )}
              {(dateRule === 'before' || dateRule === 'after' || dateRule === 'exactly') && (
                <DateValueInput value={dateFrom} onChange={setDateFrom} ariaLabel="Date value" />
              )}
              {dateRule === 'between' && (
                <>
                  <DateValueInput value={dateFrom} onChange={setDateFrom} ariaLabel="From date" />
                  <span className={styles.dateFilterAnd} aria-hidden="true">and</span>
                  <DateValueInput value={dateTo} onChange={setDateTo} ariaLabel="To date" />
                </>
              )}
            </div>        </div>

        {activeFilters.length > 0 && (
          <>
            <hr className={styles.filterRowDivider} />
            <Filters
              filters={activeFilters}
              fields={filterFields}
              onAddFilter={addFilter}
              onValueChange={setFilterValue}
              onRemove={removeFilter}
              onClear={clearFilters}
              className={styles.propertyFilters}
            />
          </>
        )}
      </>

      <div className={styles.body}>
        {filteredGroups.length > 0 ? (
          <Timeline
            groups={filteredGroups}
            onSelectOperation={(op) => setSelectedOpId(op.id)}
            forceExpandAll={hasActiveFilters}
          />
        ) : (
          <p className={styles.placeholder}>No operations match the current search and filters.</p>
        )}
      </div>

      <OperationDetailSidesheet
        operation={selectedOperation}
        open={selectedOperation !== null}
        onClose={() => setSelectedOpId(null)}
        onPrevious={() => selectedIndex > 0 && setSelectedOpId(allOperations[selectedIndex - 1].id)}
        onNext={() =>
          selectedIndex < allOperations.length - 1 && setSelectedOpId(allOperations[selectedIndex + 1].id)
        }
        hasPrevious={selectedIndex > 0}
        hasNext={selectedIndex >= 0 && selectedIndex < allOperations.length - 1}
      />
    </div>
  );
}
