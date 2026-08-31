import { useEffect, useLayoutEffect, useRef } from 'react';
import { cx } from '../../lib/cx.js';
import styles from './SegmentedToggle.module.css';

export interface SegmentedToggleItem {
  value: string;
  label: string;
}

export interface SegmentedToggleProps {
  items: SegmentedToggleItem[];
  /** Currently-selected value. */
  value: string;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * SegmentedToggle — compact text-only single-select toggle (e.g. "Change
 * History" / "User Activity"). Same sliding-pill mechanics as
 * `SegmentedControl`, but sized for inline toolbar use rather than a
 * vertical icon-over-label rail item.
 */
export function SegmentedToggle({
  items,
  value,
  onChange,
  ariaLabel = 'View',
  className,
}: SegmentedToggleProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLSpanElement | null>(null);
  const didPaintRef = useRef(false);

  const movePill = (animate: boolean) => {
    const root = rootRef.current;
    const pill = pillRef.current;
    if (!root || !pill) return;
    const active = root.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!active) return;
    if (animate) {
      pill.style.transform = `translateX(${active.offsetLeft}px)`;
      pill.style.width = `${active.offsetWidth}px`;
    } else {
      const prev = pill.style.transition;
      pill.style.transition = 'none';
      pill.style.transform = `translateX(${active.offsetLeft}px)`;
      pill.style.width = `${active.offsetWidth}px`;
      void pill.offsetWidth;
      pill.style.transition = prev;
    }
  };

  useLayoutEffect(() => {
    movePill(didPaintRef.current);
    didPaintRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, items]);

  useEffect(() => {
    const onResize = () => movePill(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className={cx(styles.root, className)} role="tablist" aria-label={ariaLabel}>
      <span ref={pillRef} aria-hidden="true" className={styles.pill} />
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cx(styles.item, selected && styles.selected)}
            onClick={() => onChange?.(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
