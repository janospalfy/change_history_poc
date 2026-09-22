import { useEffect, useRef, type Ref } from 'react';
import { cx } from '../../lib/cx.js';
import { Icon } from '../Icon/Icon.js';
import { Checkbox } from '../Checkbox/Checkbox.js';
import { Menu, type MenuEntry } from '../Menu/Menu.js';
import styles from './Filters.module.css';

/** A selectable value for a filter field (e.g. an object type). */
export interface FilterOption {
  value: string;
  label: string;
  /** Named icon from the shared manifest (uses `currentColor`). */
  icon?: string;
}

/** Definition of a filterable field, used to build the value + add menus. */
export interface FilterFieldConfig {
  id: string;
  label: string;
  /**
   * How the value is chosen. `'select'` (default) opens a menu of `options`;
   * `'date'` renders a native date picker in the chip.
   */
  type?: 'select' | 'date';
  /** Rule shown in the chip's pill (defaults to "is"). */
  rule?: string;
  /** Placeholder shown while no value is chosen (defaults to "Select value"). */
  placeholder?: string;
  /** Values the user can pick from. Used when `type` is `'select'`. */
  options?: FilterOption[];
  /**
   * How many values can be chosen at once for a `'select'` field. `'multi'`
   * (default) shows a checkbox per option; `'single'` shows a radio per
   * option and picking one replaces any previous choice (e.g. a yes/no
   * field where only one answer applies).
   */
  selectionMode?: 'single' | 'multi';
}

/** An active filter instance rendered as a chip. */
export interface ActiveFilter {
  id: string;
  fieldId: string;
  /** Used when the field's type is `'date'`. */
  value?: string;
  /** Selected values for a `'select'` field — more than one may be chosen. */
  values?: string[];
}

/**
 * A field can be configured only if it has a value-selection UI: a `date`
 * picker, or a `select` with at least one option.
 */
export function fieldHasValueUi(field: FilterFieldConfig): boolean {
  return field.type === 'date' || (field.options?.length ?? 0) > 0;
}

export interface FiltersProps {
  filters: ActiveFilter[];
  fields: FilterFieldConfig[];
  /** Add a new filter chip for the given field id. */
  onAddFilter: (fieldId: string) => void;
  /** Set the chosen value on an existing `'date'`-type filter chip. */
  onValueChange: (filterId: string, value: string) => void;
  /** Toggle a value on/off an existing `'select'`, `selectionMode: 'multi'` filter chip. */
  onToggleValue: (filterId: string, value: string) => void;
  /** Replace the value on an existing `'select'`, `selectionMode: 'single'` filter chip. */
  onSelectValue: (filterId: string, value: string) => void;
  /** Remove a single filter chip. */
  onRemove: (filterId: string) => void;
  /** Remove all filter chips. */
  onClear: () => void;
  className?: string;
}

/**
 * Filters — the filter bar shown below the toolbar once one or more filters
 * are active. Each chip has a remove segment and a body that opens a value
 * menu; the "Add Filter" control reopens the field menu and "Clear selection"
 * removes everything. Renders nothing when there are no active filters.
 */
export function Filters({
  filters,
  fields,
  onAddFilter,
  onValueChange,
  onToggleValue,
  onSelectValue,
  onRemove,
  onClear,
  className,
}: FiltersProps) {
  // The bar renders only when there's at least one active filter. Move focus
  // to it on the 0 → >0 transition (rather than on mount) so the filters
  // landmark is focused the moment it appears — even if this component was
  // mounted earlier while empty, when `barRef` would still be null.
  const barRef = useRef<HTMLDivElement | null>(null);
  const prevCount = useRef(0);
  useEffect(() => {
    if (prevCount.current === 0 && filters.length > 0) {
      barRef.current?.focus();
    }
    prevCount.current = filters.length;
  }, [filters.length]);

  if (filters.length === 0) return null;

  const fieldById = new Map(fields.map((f) => [f.id, f]));

  const addItems: MenuEntry[] = [...fields]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((f) => {
      // Only fields with a value-selection UI can be meaningfully configured, so
      // disable the rest until their UI exists.
      const supported = fieldHasValueUi(f);
      return {
        kind: 'item',
        label: f.label,
        disabled: !supported,
        onSelect: supported ? () => onAddFilter(f.id) : undefined,
      };
    });

  return (
    <div
      ref={barRef}
      className={cx(styles.filters, className)}
      role="region"
      aria-label="Active filters"
      tabIndex={-1}
    >
      <div className={styles.left}>
        {filters.map((filter) => {
          const field = fieldById.get(filter.fieldId);
          if (!field) return null;

          const rule = field.rule ?? 'is';
          const placeholder = field.placeholder ?? 'Select value';
          const isDate = field.type === 'date';
          const isSingle = field.selectionMode === 'single';
          const selectedValues = filter.values ?? [];
          const selectedOptions = (field.options ?? []).filter((o) => selectedValues.includes(o.value));
          const hasMenu = !isDate && (field.options?.length ?? 0) > 0;

          const valueItems: MenuEntry[] = (field.options ?? []).map((o) => {
            const isSelected = selectedValues.includes(o.value);
            if (isSingle) {
              return {
                kind: 'item',
                label: o.label,
                selected: isSelected,
                onSelect: () => onSelectValue(filter.id, o.value),
              };
            }
            return {
              kind: 'item',
              label: o.label,
              // Decorative only — the menu row itself owns the click/toggle,
              // so the checkbox can't fight its own native click handling.
              visual: (
                <Checkbox
                  checked={isSelected}
                  tabIndex={-1}
                  aria-hidden="true"
                  readOnly
                  className={styles.menuCheckbox}
                />
              ),
              checkbox: true,
              selected: isSelected,
              onSelect: () => onToggleValue(filter.id, o.value),
            };
          });

          const selectBody = (
            args?: { ref: Ref<HTMLElement>; onClick: () => void; expanded: boolean },
          ) => (
            <button
              ref={args?.ref as Ref<HTMLButtonElement>}
              type="button"
              className={styles.valueSegment}
              onClick={args?.onClick}
              aria-haspopup={hasMenu ? 'menu' : undefined}
              aria-expanded={args?.expanded}
            >
              {selectedOptions.length > 0 ? (
                <span className={styles.valueLabel}>
                  {selectedOptions.length === 1
                    ? selectedOptions[0].label
                    : `${selectedOptions[0].label} +${selectedOptions.length - 1}`}
                </span>
              ) : (
                <span className={styles.valuePlaceholder}>{placeholder}</span>
              )}
            </button>
          );

          return (
            <div key={filter.id} className={styles.chip}>
              <div className={styles.segment}>
                <span className={styles.fieldLabel}>{field.label}</span>
              </div>
              <div className={styles.divider} aria-hidden="true" />
              <div className={styles.segment}>
                <Icon name="Equals" size="16px" className={styles.ruleIcon} />
                <span className={styles.ruleLabel}>{rule}</span>
              </div>
              <div className={styles.divider} aria-hidden="true" />
              {isDate ? (
                <div className={styles.segment}>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={filter.value ?? ''}
                    onChange={(e) => onValueChange(filter.id, e.target.value)}
                    aria-label={`${field.label} value`}
                  />
                </div>
              ) : hasMenu ? (
                <Menu
                  ariaLabel={`${field.label} value`}
                  align="start"
                  items={valueItems}
                  trigger={(triggerArgs) => selectBody(triggerArgs)}
                />
              ) : (
                selectBody()
              )}
              <div className={styles.divider} aria-hidden="true" />
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => onRemove(filter.id)}
                aria-label={`Remove ${field.label} filter`}
              >
                <Icon name="X" size="16px" />
              </button>
            </div>
          );
        })}

        <Menu
          ariaLabel="Add filter"
          align="start"
          items={addItems}
          trigger={({ ref, onClick, expanded }) => (
            <button
              ref={ref as Ref<HTMLButtonElement>}
              type="button"
              className={styles.ghostBtn}
              onClick={onClick}
              aria-haspopup="menu"
              aria-expanded={expanded}
            >
              <Icon name="Plus" size="16px" />
              <span>Add</span>
            </button>
          )}
        />
      </div>

      <button type="button" className={styles.ghostBtn} onClick={onClear}>
        <Icon name="XCircle" size="16px" />
        <span>Clear</span>
      </button>
    </div>
  );
}
