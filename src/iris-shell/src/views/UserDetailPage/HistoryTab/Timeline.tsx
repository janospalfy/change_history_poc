import { useEffect, useRef, useState } from 'react';
import { cx } from '../../../lib/cx.js';
import { Icon } from '../../../components/Icon/Icon.js';
import { Badge } from '../../../components/Badge/Badge.js';
import type { ChangeHistoryGroup, ChangeHistoryOperation, OperationType } from './mockChangeHistory.js';
import styles from './Timeline.module.css';

const DOT_CLASS_BY_TYPE: Record<OperationType, string> = {
  created: 'dotCreate',
  changeUser: 'dotEdit',
  renamed: 'dotEdit',
  moved: 'dotEdit',
  groupMembershipChange: 'dotEdit',
  deprovision: 'dotDeprovision',
  undoDeprovision: 'dotDeprovision',
  deleted: 'dotRemove',
};

/** Groups revealed per page as the sentinel scrolls into view. */
const PAGE_SIZE = 8;

export interface TimelineProps {
  groups: ChangeHistoryGroup[];
  onSelectOperation: (operation: ChangeHistoryOperation) => void;
  /** Expand every group regardless of user interaction (e.g. while a search
   *  filter is active, so matches are visible without an extra click). */
  forceExpandAll?: boolean;
}

/**
 * Timeline — grouped, expandable operation history. Each date group is a
 * collapsed header row (marker + chevron + date + count) until expanded,
 * revealing its individual `TimelineEventItem` rows, indented under the
 * header and flush against each other (separated only by their own bottom
 * border). A single connector line runs behind every row, most of it
 * hidden behind each row's own opaque background.
 */
export function Timeline({ groups, onSelectOperation, forceExpandAll = false }: TimelineProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(Math.min(PAGE_SIZE, groups.length));
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = visibleCount < groups.length;

  // Reveal the next page of groups once the sentinel below the list
  // scrolls near the viewport — a simple infinite-scroll pagination demo.
  useEffect(() => {
    if (!hasMore) return undefined;
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setLoadingMore(true);
        // Small delay so the "Loading more" state is actually visible.
        window.setTimeout(() => {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, groups.length));
          setLoadingMore(false);
        }, 400);
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, groups.length]);

  const toggle = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const visibleGroups = groups.slice(0, visibleCount);

  return (
    <div className={styles.wrap}>
      <div className={styles.line} aria-hidden="true" />
      <div className={styles.list}>
        {visibleGroups.map((group, index) => {
          const isExpanded = forceExpandAll || expanded.has(index);
          return (
            <div
              key={group.date}
              className={cx(styles.group, isExpanded ? styles.groupSpacingNormal : styles.groupSpacingTight)}
            >
              <button
                type="button"
                className={styles.headerRow}
                aria-expanded={isExpanded}
                onClick={() => toggle(index)}
              >
                <span className={styles.marker} aria-hidden="true" />
                <span className={cx(styles.chevron, isExpanded && styles.chevronExpanded)}>
                  <Icon name="CaretRight" size="16px" />
                </span>
                <span className={styles.date}>{group.date}</span>
                <span className={styles.count}>
                  {group.operations.length} operation{group.operations.length === 1 ? '' : 's'}
                </span>
              </button>
              <div className={cx(styles.collapsible, isExpanded && styles.collapsibleExpanded)}>
                <div className={styles.eventsBlock}>
                  {group.operations.map((op) => (
                    <TimelineEventItem key={op.id} operation={op} onSelect={onSelectOperation} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className={styles.sentinel}>
          {loadingMore && <span className={styles.loadingText}>Loading more…</span>}
        </div>
      )}
    </div>
  );
}

function TimelineEventItem({
  operation,
  onSelect,
}: {
  operation: ChangeHistoryOperation;
  onSelect: (operation: ChangeHistoryOperation) => void;
}) {
  return (
    <button type="button" className={styles.eventItem} onClick={() => onSelect(operation)}>
      <span className={styles.eventTime}>{operation.time}</span>
      <span
        className={cx(styles.eventMarker, styles[DOT_CLASS_BY_TYPE[operation.type]])}
        aria-hidden="true"
      />
      <span className={styles.eventLabel}>{operation.label}</span>
      <div className={styles.eventDetails}>
        <span className={styles.eventId}>{operation.id}</span>
        <span className={styles.eventActor}>{operation.actor}</span>
        <Badge className={styles.eventBadge}>{operation.status}</Badge>
      </div>
      <span className={styles.eventChevron} aria-hidden="true">
        <Icon name="CaretRight" size="16px" />
      </span>
    </button>
  );
}
