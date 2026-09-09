import { useEffect, useRef, useState } from 'react';
import { cx } from '../../../lib/cx.js';
import { Icon } from '../../../components/Icon/Icon.js';
import { Badge } from '../../../components/Badge/Badge.js';
import { Tooltip } from '../../../components/Tooltip/Tooltip.js';
import type { ChangeHistoryGroup, ChangeHistoryOperation, OperationType } from './mockChangeHistory.js';
import styles from './Timeline.module.css';

const DOT_CLASS_BY_TYPE: Record<OperationType, string> = {
  created: 'dotCreate',
  changeUser: 'dotEdit',
  renamed: 'dotEdit',
  moved: 'dotEdit',
  groupMembershipChange: 'dotMembership',
  deprovision: 'dotDeprovision',
  undoDeprovision: 'dotDeprovision',
  deleted: 'dotRemove',
};

/** Groups revealed per page as the sentinel scrolls into view. */
const PAGE_SIZE = 8;

/** Character budget the reason column is truncated to before its own '…' is
 *  appended. Deliberately conservative for the 240px column so the CSS
 *  overflow/ellipsis on `.eventReason` is a rarely-triggered safety net,
 *  not the primary truncation mechanism — that lets us trim trailing
 *  punctuation/whitespace ourselves instead of the browser cutting a
 *  reason off mid-word or right after a stray hyphen. */
const REASON_TRUNCATE_LENGTH = 34;

function truncateReason(reason: string): string {
  if (reason.length <= REASON_TRUNCATE_LENGTH) return reason;
  const clipped = reason.slice(0, REASON_TRUNCATE_LENGTH).trimEnd().replace(/[-,.;:]+$/, '');
  return `${clipped}\u2026`;
}

export interface TimelineProps {
  groups: ChangeHistoryGroup[];
  onSelectOperation: (operation: ChangeHistoryOperation) => void;
  /** The operation currently open in the detail sidesheet, if any — its row
   *  gets a highlighted segment on the connector line. */
  selectedOperationId?: string | null;
  /** Expand every group regardless of user interaction (e.g. while a search
   *  filter is active, so matches are visible without an extra click). */
  forceExpandAll?: boolean;
  /** Change History rows show who made the change (actor). User Activity's
   *  actor is always the current user, so its rows show the target object
   *  instead — the varied, actually-informative part of that story. */
  showTargetObject?: boolean;
}

/**
 * Timeline — grouped, expandable operation history. Each date group is a
 * collapsed header row (marker + chevron + date + count) until expanded,
 * revealing its individual `TimelineEventItem` rows, indented under the
 * header and flush against each other (separated only by their own bottom
 * border). A single connector line runs behind every row, most of it
 * hidden behind each row's own opaque background.
 */
export function Timeline({
  groups,
  onSelectOperation,
  selectedOperationId = null,
  forceExpandAll = false,
  showTargetObject = false,
}: TimelineProps) {
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
                    <TimelineEventItem
                      key={op.id}
                      operation={op}
                      selected={op.id === selectedOperationId}
                      onSelect={onSelectOperation}
                      showTargetObject={showTargetObject}
                    />
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
  selected,
  onSelect,
  showTargetObject,
}: {
  operation: ChangeHistoryOperation;
  selected: boolean;
  onSelect: (operation: ChangeHistoryOperation) => void;
  showTargetObject: boolean;
}) {
  return (
    <button type="button" className={cx(styles.eventItem, selected && styles.eventItemSelected)} onClick={() => onSelect(operation)}>
      {selected && <span className={styles.eventLineHighlight} aria-hidden="true" />}
      <span className={styles.eventTime}>{operation.time}</span>
      <span
        className={cx(styles.eventMarker, styles[DOT_CLASS_BY_TYPE[operation.type]])}
        aria-hidden="true"
      />
      <span className={styles.eventLabel}>{operation.label}</span>
      <Tooltip label={`Reason: ${operation.reason}`} placement="top">
        <span className={styles.eventReason}>{truncateReason(operation.reason)}</span>
      </Tooltip>
      <div className={styles.eventDetails}>
        <span className={styles.eventActor} title={showTargetObject ? 'Target object' : 'Requested by'}>
          {showTargetObject && <span className={styles.eventActorLabel}>Target:</span>}
          <span className={styles.eventActorValue}>{showTargetObject ? operation.targetObject : operation.actor}</span>
        </span>
        <Badge className={styles.eventBadge}>{operation.status}</Badge>
      </div>
      <span className={styles.eventChevron} aria-hidden="true">
        <Icon name="CaretRight" size="16px" />
      </span>
    </button>
  );
}
