/** Matches the Figma `Timeline/Event Item` component's `operation` variants
 *  exactly (node 1234:8600), including their real display labels. */
export type OperationType =
  | 'changeUser'
  | 'renamed'
  | 'moved'
  | 'created'
  | 'groupMembershipChange'
  | 'deprovision'
  | 'undoDeprovision'
  | 'deleted';

/** Matches the Figma `Status Badge` component's variants exactly. */
export type OperationStatus = 'Completed' | 'Pending' | 'Denied' | 'Canceled';

/** Simplified verb shown as the sidesheet's "Type" field (Operation Details
 *  section), matching node 1454:27046 exactly (e.g. "Modify"). */
export const OPERATION_TYPE_VERB: Record<OperationType, string> = {
  created: 'Create',
  changeUser: 'Modify',
  renamed: 'Modify',
  moved: 'Modify',
  groupMembershipChange: 'Modify',
  deprovision: 'Deprovision',
  undoDeprovision: 'Undo Deprovision',
  deleted: 'Delete',
};

export interface PropertyChange {
  property: string;
  attribute: string;
  changeNote: string;
  oldValue: string;
  newValue: string;
}

/** Matches the sidesheet's "Operation summary" + "Operation details"
 *  sections exactly (Figma node 1454:27046) — not a generic key/value list. */
export interface ChangeHistoryOperation {
  id: string;
  time: string;
  type: OperationType;
  label: string;
  actor: string;
  status: OperationStatus;
  /** Full date, matching the parent group. */
  date: string;
  /** Object name + directory context, e.g. "My OU (O1D.local/Test OU)". */
  name: string;
  reason: string;
  /** Formatted date + time the operation was requested. */
  requestedAt: string;
  logonComputer: string;
  logonSite: string;
  activeRolesAdmin: 'Yes' | 'No';
  /** Linked target object, e.g. "Peter Kim (O1D.local/Test OU)". */
  targetObject: string;
  lastUpdatedOn: string;
  changes: PropertyChange[];
}

export interface ChangeHistoryGroup {
  date: string;
  operations: ChangeHistoryOperation[];
}


/* ------------------------------------------------------------------ */
/*  Older, generated groups — bulk filler so the timeline has enough   */
/*  history to demo infinite-scroll pagination.                       */
/* ------------------------------------------------------------------ */

const GENERATED_ACTORS = [
  'administrator (O1D.local)',
  'sara.ito (O1D.local)',
  'peter.kim (O1D.local)',
  'isabella.clark (O1D.local)',
];

const GENERATED_TYPES: { type: OperationType; label: string }[] = [
  { type: 'created', label: 'Created' },
  { type: 'changeUser', label: 'Change user' },
  { type: 'renamed', label: 'Renamed' },
  { type: 'moved', label: 'Moved' },
  { type: 'groupMembershipChange', label: 'Group membership change' },
  { type: 'deprovision', label: 'Deprovision user' },
  { type: 'undoDeprovision', label: 'Undo deprovisioning' },
  { type: 'deleted', label: 'Deleted' },
];

const GENERATED_STATUSES: OperationStatus[] = ['Completed', 'Pending', 'Denied', 'Canceled'];

function buildGeneratedOperation(dateLabel: string, seed: number): ChangeHistoryOperation {
  const { type, label } = GENERATED_TYPES[seed % GENERATED_TYPES.length];
  const actor = GENERATED_ACTORS[seed % GENERATED_ACTORS.length];
  const status = GENERATED_STATUSES[seed % GENERATED_STATUSES.length];
  const opId = 3000 + seed;
  const hour = 8 + (seed % 10);
  const minute = (seed * 7) % 60;
  const second = (seed * 13) % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const time = `${pad(hour)}:${pad(minute)}:${pad(second)}`;
  const requestedAt = `${dateLabel} ${time} UTC`;

  return {
    id: `ID: 1-${opId}`,
    time,
    type,
    label,
    actor,
    status,
    date: dateLabel,
    name: `user-${opId} (O1D.local/Test OU)`,
    reason: '<none>',
    requestedAt,
    logonComputer: seed % 2 === 0 ? 'ActiveRolesVm.O1D.local' : 'ActiveRolesVm2.O1D.local',
    logonSite: 'Default-First-Site-Name',
    activeRolesAdmin: seed % 3 === 0 ? 'Yes' : 'No',
    targetObject: `user-${opId} (O1D.local/Test OU)`,
    lastUpdatedOn: requestedAt,
    changes: [
      {
        property: 'Description',
        attribute: '(description)',
        changeNote: 'Replace value · Operation initiator',
        oldValue: `Value ${opId - 1}`,
        newValue: `Value ${opId}`,
      },
    ],
  };
}

/** Deterministically generates `count` older date groups, each with 1-3
 *  operations, going backward from October 2026. */
function generateOlderGroups(count: number): ChangeHistoryGroup[] {
  const groups: ChangeHistoryGroup[] = [];
  const cursor = new Date(2026, 9, 30); // October 30, 2026 — just before the hand-authored groups
  let seed = 0;

  for (let i = 0; i < count; i++) {
    cursor.setDate(cursor.getDate() - (1 + (i % 3)));
    const dateLabel = cursor.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const opsCount = 1 + (i % 3);
    const operations = Array.from({ length: opsCount }, () => buildGeneratedOperation(dateLabel, seed++));
    groups.push({ date: dateLabel, operations });
  }

  return groups;
}

/** Mock change-history data for the History tab timeline (POC only). */
export const MOCK_CHANGE_HISTORY: ChangeHistoryGroup[] = [
  {
    date: 'November 13, 2026',
    operations: [
      {
        id: 'ID: 1-4102',
        time: '09:12:03',
        type: 'created',
        label: 'Created',
        actor: 'administrator (O1D.local)',
        status: 'Completed',
        date: 'November 13, 2026',
        name: 'Peter Kim (O1D.local/Test OU)',
        reason: '<none>',
        requestedAt: 'November 13, 2026 09:12:03 UTC',
        logonComputer: 'ActiveRolesVm.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'Yes',
        targetObject: 'Peter Kim (O1D.local/Test OU)',
        lastUpdatedOn: 'November 13, 2026 09:12:03 UTC',
        changes: [
          {
            property: 'User Principal Name',
            attribute: '(userPrincipalName)',
            changeNote: 'Set value · Operation initiator',
            oldValue: '<not set>',
            newValue: 'peter.kim@O1D.local',
          },
        ],
      },
      {
        id: 'ID: 1-4098',
        time: '08:47:51',
        type: 'changeUser',
        label: 'Change user',
        actor: 'sara.ito (O1D.local)',
        status: 'Pending',
        date: 'November 13, 2026',
        name: 'Isabella Clark (O1D.local/Test OU)',
        reason: '<none>',
        requestedAt: 'November 13, 2026 08:47:51 UTC',
        logonComputer: 'ActiveRolesVm.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'No',
        targetObject: 'Isabella Clark (O1D.local/Test OU)',
        lastUpdatedOn: 'November 13, 2026 08:47:51 UTC',
        changes: [
          {
            property: 'Job Title',
            attribute: '(title)',
            changeNote: 'Replace value · Operation initiator',
            oldValue: 'Analyst',
            newValue: 'Senior Analyst',
          },
        ],
      },
    ],
  },
  {
    date: 'November 5, 2026',
    operations: [
      {
        id: 'ID: 1-4061',
        time: '15:02:44',
        type: 'changeUser',
        label: 'Change user',
        actor: 'administrator (O1D.local)',
        status: 'Completed',
        date: 'November 5, 2026',
        name: 'My OU (O1D.local/Test OU)',
        reason: '<none>',
        requestedAt: 'November 5, 2026 15:02:44 UTC',
        logonComputer: 'ActiveRolesVm.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'Yes',
        targetObject: 'Peter Kim (O1D.local/Test OU)',
        lastUpdatedOn: 'November 5, 2026 15:02:44 UTC',
        changes: [
          {
            property: 'E-Mail Address',
            attribute: '(mail)',
            changeNote: 'Replace value · Operation initiator',
            oldValue: '<not set>',
            newValue: 'peter@saasii.io',
          },
          {
            property: 'User Password',
            attribute: '(edsaPassword)',
            changeNote: 'Replace value · Operation initiator',
            oldValue: '********',
            newValue: '********',
          },
        ],
      },
      {
        id: 'ID: 1-4055',
        time: '14:50:19',
        type: 'deprovision',
        label: 'Deprovision user',
        actor: 'peter.kim (O1D.local)',
        status: 'Canceled',
        date: 'November 5, 2026',
        name: 'Contractor Temp (O1D.local/Test OU)',
        reason: '<none>',
        requestedAt: 'November 5, 2026 14:50:19 UTC',
        logonComputer: 'ActiveRolesVm2.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'No',
        targetObject: 'Contractor Temp (O1D.local/Test OU)',
        lastUpdatedOn: 'November 5, 2026 14:50:19 UTC',
        changes: [
          {
            property: 'Account Status',
            attribute: '(userAccountControl)',
            changeNote: 'Replace value · Operation initiator',
            oldValue: 'Enabled',
            newValue: 'Disabled',
          },
        ],
      },
      {
        id: 'ID: 1-4047',
        time: '14:42:12',
        type: 'deleted',
        label: 'Deleted',
        actor: 'administrator (O1D.local)',
        status: 'Denied',
        date: 'November 5, 2026',
        name: 'svc-backup (O1D.local/Test OU)',
        reason: '<none>',
        requestedAt: 'November 5, 2026 14:42:12 UTC',
        logonComputer: 'ActiveRolesVm.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'Yes',
        targetObject: 'svc-backup (O1D.local/Test OU)',
        lastUpdatedOn: 'November 5, 2026 14:42:12 UTC',
        changes: [
          {
            property: 'Object',
            attribute: '(distinguishedName)',
            changeNote: 'Remove object · Operation initiator',
            oldValue: 'CN=svc-backup,OU=Test OU',
            newValue: '<removed>',
          },
        ],
      },
    ],
  },
  {
    date: 'November 4, 2026',
    operations: [
      {
        id: 'ID: 1-4022',
        time: '11:15:37',
        type: 'created',
        label: 'Created',
        actor: 'administrator (O1D.local)',
        status: 'Completed',
        date: 'November 4, 2026',
        name: 'Sara Ito (O1D.local/Test OU)',
        reason: '<none>',
        requestedAt: 'November 4, 2026 11:15:37 UTC',
        logonComputer: 'ActiveRolesVm.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'Yes',
        targetObject: 'Sara Ito (O1D.local/Test OU)',
        lastUpdatedOn: 'November 4, 2026 11:15:37 UTC',
        changes: [
          {
            property: 'User Principal Name',
            attribute: '(userPrincipalName)',
            changeNote: 'Set value · Operation initiator',
            oldValue: '<not set>',
            newValue: 'sara.ito@O1D.local',
          },
        ],
      },
    ],
  },
  ...generateOlderGroups(40),
];


