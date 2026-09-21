import { useMemo, useRef, useState, type Ref } from 'react';
import { cx } from '../../../lib/cx.js';
import { SegmentedToggle } from '../../../components/SegmentedToggle/SegmentedToggle.js';
import { TextInput } from '../../../components/TextInput/TextInput.js';
import { IconButton } from '../../../components/IconButton/IconButton.js';
import { Button } from '../../../components/Button/Button.js';
import { Tooltip } from '../../../components/Tooltip/Tooltip.js';
import { Menu } from '../../../components/Menu/Menu.js';
import { Icon } from '../../../components/Icon/Icon.js';
import { showToast } from '../../../lib/toastStore.js';
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
  formatSidesheetTimestamp,
  type ChangeHistoryGroup,
  type ChangeHistoryOperation,
  type OperationType,
} from './mockChangeHistory.js';
import styles from './HistoryTab.module.css';

const VIEW_ITEMS = [
  { value: 'changeHistory', label: 'Change history' },
  { value: 'userActivity', label: 'User activity' },
];

/** A native date input with the browser's calendar icon replaced by the
 *  Iris `CalendarBlank` glyph (the native icon is kept, just made
 *  invisible, so its click target still opens the native picker), plus a
 *  separate, optional time input next to it. Time is intentionally not
 *  required — a bare date filters the whole day; adding a time narrows
 *  the match down to that precise instant (see the filtering logic below). */
function DateValueInput({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateAriaLabel,
  timeAriaLabel,
}: {
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  dateAriaLabel: string;
  timeAriaLabel: string;
}) {
  const timeInputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <span className={styles.dateInputWrapper}>
        <input
          type="date"
          className={cx(styles.dateFilterSegment, styles.dateFilterValueSegment, styles.dateInput)}
          aria-label={dateAriaLabel}
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
        <Icon name="CalendarBlank" size="12px" className={styles.dateInputIcon} />
      </span>
      <span className={cx(styles.timeInputWrapper, time !== '' && styles.timeInputWrapperWithClear)}>
        <input
          ref={timeInputRef}
          type="time"
          className={cx(styles.dateFilterSegment, styles.dateFilterValueSegment, styles.timeInput)}
          aria-label={timeAriaLabel}
          placeholder="Any time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
        />
        {time !== '' && (
          <button
            type="button"
            className={styles.timeInputClear}
            onClick={() => onTimeChange('')}
            aria-label={`Clear ${timeAriaLabel.toLowerCase()}`}
          >
            <Icon name="X" size="10px" />
          </button>
        )}
        <button
          type="button"
          className={styles.timeInputIconButton}
          onClick={() => timeInputRef.current?.showPicker?.()}
          aria-label={`Open ${timeAriaLabel.toLowerCase()} picker`}
          tabIndex={-1}
        >
          <Icon name="Clock" size="12px" />
        </button>
      </span>
    </>
  );
}

/** Operation-type filter chips shown in the filter strip. Dot colours are
 *  fixed per type, matching the Figma design (not user-configurable). Each
 *  chip is a broad bucket covering one or more granular operation types. */
const OPERATION_TYPES = [
  { value: 'edit', label: 'Update', dotClassName: 'dotEdit', selectedClassName: 'typeChipEditSelected' },
  {
    value: 'membership',
    label: 'Membership',
    dotClassName: 'dotMembership',
    selectedClassName: 'typeChipMembershipSelected',
  },
  { value: 'create', label: 'Create', dotClassName: 'dotCreate', selectedClassName: 'typeChipCreateSelected' },
  { value: 'remove', label: 'Delete', dotClassName: 'dotRemove', selectedClassName: 'typeChipRemoveSelected' },
  {
    value: 'deprovision',
    label: 'Deprovisioning',
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
  groupMembershipChange: 'membership',
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
      options.push({ value, label: fieldId === 'lastUpdatedOn' ? formatSidesheetTimestamp(value) : value });
    }
  }
  return options;
}

/** Distinct property names across every operation's `changes` list (e.g.
 *  "Email address", "User password") — an operation can touch several, so
 *  this can't be derived via `getFieldValue`/`uniqueOptions` like the
 *  single-valued fields above. */
function uniqueChangedPropertyOptions(operations: ChangeHistoryOperation[]): { value: string; label: string }[] {
  const seen = new Set<string>();
  const options: { value: string; label: string }[] = [];
  for (const op of operations) {
    for (const change of op.changes) {
      if (!seen.has(change.property)) {
        seen.add(change.property);
        options.push({ value: change.property, label: change.property });
      }
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

/** yyyy-MM-DD (local time), used as the default value for the
 *  before/after/exactly/between date inputs. Time starts blank — optional. */
function toDateOnly(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Combines a date input with an optional time input into a timestamp. When
 *  time is blank, falls back to the start or end of that day — this is what
 *  makes the time input optional: a bare date still filters meaningfully,
 *  as "the whole day" rather than requiring an exact instant. */
function combineDateTime(date: string, time: string, boundary: 'start' | 'end'): number | null {
  if (!date) return null;
  if (time) return new Date(`${date}T${time}`).getTime();
  return new Date(`${date}T${boundary === 'start' ? '00:00:00' : '23:59:59.999'}`).getTime();
}

/** An operation's full date + time as a single timestamp, so date filtering
 *  can compare down to the minute rather than just the whole day. */
function getOperationTimestamp(op: ChangeHistoryOperation): number {
  return new Date(`${op.date} ${op.time}`).getTime();
}

/** Everything derived from a single operations list (dataset-dependent, so
 *  Change History and User Activity each get their own). */
function buildDatasetContext(dataset: ChangeHistoryGroup[]) {
  const allOperations = dataset.flatMap((group) => group.operations);
  const latestDate = allOperations.reduce((latest, op) => Math.max(latest, getOperationTimestamp(op)), 0);
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
      // A yes/no field \u2014 only one answer can apply at a time.
      selectionMode: 'single',
      options: uniqueOptions(allOperations, 'activeRolesAdmin'),
    },
    { id: 'targetObject', label: 'Target object', options: uniqueOptions(allOperations, 'targetObject') },
    { id: 'lastUpdatedOn', label: 'Last updated on', options: uniqueOptions(allOperations, 'lastUpdatedOn') },
    { id: 'propertyChanged', label: 'Property changed', options: uniqueChangedPropertyOptions(allOperations) },
  ];
  return { allOperations, latestDate, latestDateOnly: toDateOnly(latestDate), filterFields };
}

/** Which dataset (Change History vs User Activity) a given operation id
 *  belongs to — lets a deep-linked `op` param resolve to the right view on
 *  first render, without needing the view itself in the URL (operation ids
 *  are unique across both mock datasets). */
function findOperationView(opId: string | null): 'changeHistory' | 'userActivity' | null {
  if (!opId) return null;
  if (MOCK_CHANGE_HISTORY.some((group) => group.operations.some((op) => op.id === opId))) return 'changeHistory';
  if (MOCK_USER_ACTIVITY.some((group) => group.operations.some((op) => op.id === opId))) return 'userActivity';
  return null;
}

export interface HistoryTabProps {
  subjectName: string;
  /** The operation currently open in the detail sidesheet, derived from the
   *  URL — never stored as local state (see "Deep-Linking" pattern). */
  selectedOperationId: string | null;
  /** Navigates to (or away from, when passed `null`) an operation's unique URL. */
  onSelectOperation: (operationId: string | null) => void;
}

/**
 * HistoryTab — the User Detail page's "History" tab. Hosts the Change
 * History / User Activity toggle, search + export + filter toolbar, and
 * (further down the audit) the grouped timeline and operation sidesheet.
 */
export function HistoryTab({ subjectName, selectedOperationId, onSelectOperation }: HistoryTabProps) {
  const [view, setView] = useState(() => findOperationView(selectedOperationId) ?? 'changeHistory');
  const [query, setQuery] = useState('');
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [dateRule, setDateRule] = useState<DateRule | null>(null);
  const [dateRelativeId, setDateRelativeId] = useState<(typeof DATE_RELATIVE_OPTIONS)[number]['id']>('last30');
  const [dateFrom, setDateFrom] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const filterIdRef = useRef(0);

  const activeDataset = view === 'changeHistory' ? MOCK_CHANGE_HISTORY : MOCK_USER_ACTIVITY;
  // Change History is about things done TO the current object, so its Name
  // and Target object fields always reflect the subject being viewed. User
  // Activity is about things the current user DID to other (varied) objects,
  // so there the subject instead always appears as the actor ("Requested
  // by") — Name is set to match Target object (whichever varied object the
  // activity was on), not the actor's own identity.
  const subjectLabel = `${subjectName} (O1D.local/Test OU)`;
  const subjectActor = `${subjectName.toLowerCase().replace(/\s+/g, '.')} (O1D.local)`;
  const displayDataset = useMemo(
    () =>
      activeDataset.map((group) => ({
        ...group,
        operations: group.operations.map((op) =>
          view === 'changeHistory'
            ? { ...op, name: subjectLabel, targetObject: subjectLabel }
            : { ...op, actor: subjectActor, name: op.targetObject },
        ),
      })),
    [activeDataset, view, subjectLabel, subjectActor],
  );
  const { allOperations, latestDate, latestDateOnly, filterFields } = useMemo(
    () => buildDatasetContext(displayDataset),
    [displayDataset],
  );

  // Switching views swaps the whole dataset out from under any active
  // filters, so reset them rather than leaving stale/mismatched selections.
  const prevView = useRef(view);
  if (prevView.current !== view) {
    prevView.current = view;
    setActiveTypes([]);
    setActiveFilters([]);
    setDateRule(null);
    setDateFrom(latestDateOnly);
    setTimeFrom('');
    setDateTo(latestDateOnly);
    setTimeTo('');
    onSelectOperation(null);
  }
  if (dateFrom === '' && dateTo === '') {
    setDateFrom(latestDateOnly);
    setDateTo(latestDateOnly);
  }

  const selectedIndex = allOperations.findIndex((op) => op.id === selectedOperationId);
  const selectedOperation: ChangeHistoryOperation | null =
    selectedIndex >= 0 ? allOperations[selectedIndex] : null;

  const trimmedQuery = query.trim().toLowerCase();
  const hasActiveFilters =
    trimmedQuery.length > 0 || activeTypes.length > 0 || activeFilters.length > 0 || dateRule !== null;
  // "start"/"end" boundaries fall back to the whole day when no time is
  // given (see `combineDateTime`) — that's what makes the time input
  // optional rather than required alongside the date.
  const fromStart = combineDateTime(dateFrom, timeFrom, 'start');
  const fromEnd = combineDateTime(dateFrom, timeFrom, 'end');
  const toEnd = combineDateTime(dateTo, timeTo, 'end');
  const relativeCutoff =
    latestDate - (DATE_RELATIVE_OPTIONS.find((f) => f.id === dateRelativeId)?.days ?? 0) * 86_400_000;
  const filteredGroups = useMemo(() => {
    return displayDataset.map((group) => ({
      ...group,
      operations: group.operations.filter((op) => {
        const matchesQuery =
          !trimmedQuery ||
          op.label.toLowerCase().includes(trimmedQuery) ||
          op.id.toLowerCase().includes(trimmedQuery);
        const matchesType = activeTypes.length === 0 || activeTypes.includes(BUCKET_BY_TYPE[op.type]);
        const matchesFilters = activeFilters.every((filter) => {
          const values = filter.values ?? [];
          if (values.length === 0) return true;
          if (filter.fieldId === 'propertyChanged') {
            return op.changes.some((change) => values.includes(change.property));
          }
          return values.includes(getFieldValue(op, filter.fieldId));
        });
        const opTime = getOperationTimestamp(op);
        let matchesDate = true;
        if (dateRule === 'relative') matchesDate = opTime >= relativeCutoff;
        // Before/after compare against the start/end of the day when no
        // time was entered, so "before Aug 20" excludes Aug 20 itself and
        // "after Aug 20" only starts matching on Aug 21.
        else if (dateRule === 'before') matchesDate = fromStart !== null && opTime < fromStart;
        else if (dateRule === 'after') matchesDate = fromEnd !== null && opTime > fromEnd;
        // With a time entered, "Is" matches that specific minute (inputs
        // are minute-precision, operation timestamps carry seconds). With
        // no time, "Is" matches anywhere within that whole day instead.
        else if (dateRule === 'exactly')
          matchesDate = timeFrom
            ? fromStart !== null && Math.floor(opTime / 60_000) === Math.floor(fromStart / 60_000)
            : fromStart !== null && fromEnd !== null && opTime >= fromStart && opTime <= fromEnd;
        else if (dateRule === 'between')
          matchesDate = fromStart !== null && toEnd !== null && opTime >= fromStart && opTime <= toEnd;
        return matchesQuery && matchesType && matchesFilters && matchesDate;
      }),
    })).filter((group) => group.operations.length > 0);
  }, [displayDataset, trimmedQuery, activeTypes, activeFilters, dateRule, relativeCutoff, fromStart, fromEnd, toEnd, timeFrom]);

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
  const toggleFilterValue = (id: string, value: string) =>
    setActiveFilters((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const values = f.values ?? [];
        return { ...f, values: values.includes(value) ? values.filter((v) => v !== value) : [...values, value] };
      }),
    );
  const selectFilterValue = (id: string, value: string) =>
    setActiveFilters((prev) => prev.map((f) => (f.id === id ? { ...f, values: [value] } : f)));
  const removeFilter = (id: string) => setActiveFilters((prev) => prev.filter((f) => f.id !== id));
  const clearFilters = () => setActiveFilters([]);

  const addFilterMenuItems = [...filterFields]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((field) => {
      const supported = fieldHasValueUi(field);
      return {
        kind: 'item' as const,
        label: field.label,
        disabled: !supported,
        onSelect: supported ? () => addFilter(field.id) : undefined,
      };
    });

  const exportSubjectLabel = view === 'changeHistory' ? 'Change history' : 'User activity';
  const exportMenuItems = [
    {
      kind: 'item' as const,
      label: 'Export as HTML',
      icon: 'FileHtml',
      onSelect: () => showToast('Export successful', undefined, `${exportSubjectLabel} has been exported as HTML.`),
    },
    {
      kind: 'item' as const,
      label: 'Export as XML',
      icon: 'FileCode',
      onSelect: () => showToast('Export successful', undefined, `${exportSubjectLabel} has been exported as XML.`),
    },
    {
      kind: 'item' as const,
      label: 'Export as CSV',
      icon: 'FileCsv',
      onSelect: () => showToast('Export successful', undefined, `${exportSubjectLabel} has been exported as CSV.`),
    },
    {
      kind: 'item' as const,
      label: 'Export as PDF',
      icon: 'FilePdf',
      onSelect: () => showToast('Export successful', undefined, `${exportSubjectLabel} has been exported as PDF.`),
    },
  ];

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
        <div className={styles.toolbarActions}>
          <Menu
            ariaLabel="Add filter"
            align="end"
            items={addFilterMenuItems}
            trigger={({ ref, onClick, expanded }) => (
              <Tooltip
                label={activeFilters.length > 0 ? `Add filter (${activeFilters.length} active)` : 'Add filter'}
              >
                <span className={styles.filterButtonWrap}>
                  <Button
                    ref={ref as Ref<HTMLButtonElement>}
                    iconLead="FunnelSimple"
                    variant="secondary"
                    aria-haspopup="menu"
                    aria-expanded={expanded}
                    aria-label={
                      activeFilters.length > 0 ? `Add filter, ${activeFilters.length} active` : 'Add filter'
                    }
                    className={activeFilters.length > 0 ? styles.filterButtonActive : undefined}
                    onClick={onClick}
                  >
                    Filter
                  </Button>
                  {activeFilters.length > 0 && (
                    <span className={styles.filterCountBadge} aria-hidden="true">
                      {activeFilters.length}
                    </span>
                  )}
                </span>
              </Tooltip>
            )}
          />
          <Menu
            ariaLabel="Export"
            align="end"
            items={exportMenuItems}
            trigger={({ ref, onClick, expanded }) => (
              <Tooltip label="Export">
                <IconButton
                  ref={ref as Ref<HTMLButtonElement>}
                  icon="Export"
                  ariaLabel="Export"
                  variant="secondary"
                  aria-haspopup="menu"
                  aria-expanded={expanded}
                  onClick={onClick}
                />
              </Tooltip>
            )}
          />
        </div>
      </div>

      <>
        <div className={styles.filterStrip} role="group" aria-label="Filter by operation type">
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
                <span className={styles.chipDivider} aria-hidden="true" />
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
                    <Icon name="CaretDown" size="12px" className={styles.dateFilterCaret} />
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
                <DateValueInput
                  date={dateFrom}
                  time={timeFrom}
                  onDateChange={setDateFrom}
                  onTimeChange={setTimeFrom}
                  dateAriaLabel="Date value"
                  timeAriaLabel="Time value"
                />
              )}
              {dateRule === 'between' && (
                <>
                  <DateValueInput
                    date={dateFrom}
                    time={timeFrom}
                    onDateChange={setDateFrom}
                    onTimeChange={setTimeFrom}
                    dateAriaLabel="From date"
                    timeAriaLabel="From time"
                  />
                  <span className={styles.dateFilterAnd} aria-hidden="true">and</span>
                  <DateValueInput
                    date={dateTo}
                    time={timeTo}
                    onDateChange={setDateTo}
                    onTimeChange={setTimeTo}
                    dateAriaLabel="To date"
                    timeAriaLabel="To time"
                  />
                </>
              )}
              {dateRule !== null && (
                <button
                  type="button"
                  className={styles.dateFilterClear}
                  onClick={() => setDateRule(null)}
                  aria-label="Clear date filter"
                >
                  <Icon name="X" size="12px" />
                </button>
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
              onToggleValue={toggleFilterValue}
              onSelectValue={selectFilterValue}
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
            onSelectOperation={(op) => onSelectOperation(op.id)}
            selectedOperationId={selectedOperationId}
            forceExpandAll={hasActiveFilters}
            showTargetObject={view === 'userActivity'}
            totalOperationCount={allOperations.length}
          />
        ) : (
          <p className={styles.placeholder}>No operations match the current search and filters.</p>
        )}
      </div>

      <OperationDetailSidesheet
        operation={selectedOperation}
        open={selectedOperation !== null}
        onClose={() => onSelectOperation(null)}
        onPrevious={() => selectedIndex > 0 && onSelectOperation(allOperations[selectedIndex - 1].id)}
        onNext={() =>
          selectedIndex < allOperations.length - 1 && onSelectOperation(allOperations[selectedIndex + 1].id)
        }
        hasPrevious={selectedIndex > 0}
        hasNext={selectedIndex >= 0 && selectedIndex < allOperations.length - 1}
      />
    </div>
  );
}
