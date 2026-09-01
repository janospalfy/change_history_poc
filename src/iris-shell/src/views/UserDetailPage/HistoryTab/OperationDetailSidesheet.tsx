import type { Ref } from 'react';
import { cx } from '../../../lib/cx.js';
import { SideSheet } from '../../../components/SideSheet/SideSheet.js';
import { IconButton } from '../../../components/IconButton/IconButton.js';
import { Tooltip } from '../../../components/Tooltip/Tooltip.js';
import { Button } from '../../../components/Button/Button.js';
import { Menu } from '../../../components/Menu/Menu.js';
import { DescriptionList } from '../../../components/DescriptionList/DescriptionList.js';
import { Badge } from '../../../components/Badge/Badge.js';
import { Link } from '../../../components/Link/Link.js';
import { showToast } from '../../../lib/toastStore.js';
import { OPERATION_TYPE_VERB, type ChangeHistoryOperation, type OperationType } from './mockChangeHistory.js';
import styles from './OperationDetailSidesheet.module.css';

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

export interface OperationDetailSidesheetProps {
  operation: ChangeHistoryOperation | null;
  open: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * OperationDetailSidesheet — right-docked panel showing the full detail for
 * a single timeline operation: summary metadata, the properties changed
 * (before/after), and secondary operation details.
 */
export function OperationDetailSidesheet({
  operation,
  open,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: OperationDetailSidesheetProps) {
  if (!operation) return null;

  // Matches the sidesheet's real field order exactly (Figma node 1454:27046).
  const summaryItems = [
    { label: 'Name', value: operation.name },
    { label: 'Reason', value: operation.reason },
    { label: 'Operation ID', value: operation.id.replace(/^ID:\s*/, '') },
    {
      label: 'Requested by',
      value: (
        <Link href="#" onClick={(e) => e.preventDefault()}>
          {operation.actor}
        </Link>
      ),
    },
    { label: 'Requested', value: operation.requestedAt },
    { label: 'Status', value: <Badge>{operation.status}</Badge> },
  ];

  const detailItems = [
    { label: 'Logon computer', value: operation.logonComputer },
    { label: 'Logon site', value: operation.logonSite },
    { label: 'Active Roles Admin', value: operation.activeRolesAdmin },
    {
      label: 'Target object',
      value: (
        <Link href="#" onClick={(e) => e.preventDefault()}>
          {operation.targetObject}
        </Link>
      ),
    },
    { label: 'Type', value: OPERATION_TYPE_VERB[operation.type] },
    { label: 'Last updated on', value: operation.lastUpdatedOn },
  ];

  const exportMenuItems = [
    {
      kind: 'item' as const,
      label: 'Export as HTML',
      icon: 'FileHtml',
      onSelect: () => showToast('Export successful', undefined, 'This operation has been exported as HTML.'),
    },
    {
      kind: 'item' as const,
      label: 'Export as CSV',
      icon: 'FileCsv',
      onSelect: () => showToast('Export successful', undefined, 'This operation has been exported as CSV.'),
    },
    {
      kind: 'item' as const,
      label: 'Export as PDF',
      icon: 'FilePdf',
      onSelect: () => showToast('Export successful', undefined, 'This operation has been exported as PDF.'),
    },
  ];

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={`${operation.label} operation details`}
      title={
        <span className={styles.titleRow}>
          <span
            className={cx(styles.marker, styles[DOT_CLASS_BY_TYPE[operation.type]])}
            aria-hidden="true"
          />
          {operation.label}
        </span>
      }
      headerActions={
        <div className={styles.pager}>
          <Tooltip label="Previous operation">
            <IconButton
              icon="CaretUp"
              ariaLabel="Previous operation"
              onClick={onPrevious}
              disabled={!hasPrevious}
            />
          </Tooltip>
          <Tooltip label="Next operation">
            <IconButton
              icon="CaretDown"
              ariaLabel="Next operation"
              onClick={onNext}
              disabled={!hasNext}
            />
          </Tooltip>
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
                  aria-haspopup="menu"
                  aria-expanded={expanded}
                  onClick={onClick}
                />
              </Tooltip>
            )}
          />
        </div>
      }
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Operation summary</h3>
        <DescriptionList items={summaryItems} />
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Properties changed ({operation.changes.length})</h3>
        <div className={styles.changesTable}>
          <div className={styles.changesHeaderRow}>
            <span>Property</span>
            <span>Old value</span>
            <span>New value</span>
          </div>
          {operation.changes.map((change) => (
            <div key={change.property} className={styles.changeRow}>
              <div className={styles.changeProperty}>
                <span className={styles.changePropertyName}>{change.property}</span>
                <span className={styles.changeAttribute}>{change.attribute}</span>
                <span className={styles.changeNote}>{change.changeNote}</span>
              </div>
              <span className={styles.changeValue}>{change.oldValue}</span>
              <span className={styles.changeValue}>{change.newValue}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitleSecondary}>Operation details</h3>
        <div className={styles.detailsPanel}>
          <DescriptionList items={detailItems} />
        </div>
      </section>
    </SideSheet>
  );
}
