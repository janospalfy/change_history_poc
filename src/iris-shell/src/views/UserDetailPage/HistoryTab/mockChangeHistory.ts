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

/** A single expandable row in the sidesheet's "Workflow Activities and Policy
 *  Actions" accordion — shown for Deprovision operations only (Figma node
 *  1312:12553). */
export interface WorkflowActivity {
  name: string;
  timestamp: string;
  /** Built-in/custom policy that ran this activity, rendered as a link. */
  policy?: string;
  /** Plain description lines, e.g. "The user account is disabled". */
  notes: string[];
  /** Trailing named change shown indented under the notes, e.g. the user's
   *  DN being renamed to mark it as deprovisioned. */
  change?: { label: string; oldValue: string; newValue: string };
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
  /** Deprovision operations only — overrides DEFAULT_DEPROVISION_WORKFLOW. */
  workflowActivities?: WorkflowActivity[];
}

export interface ChangeHistoryGroup {
  date: string;
  operations: ChangeHistoryOperation[];
}

/** Shared workflow steps shown for any Deprovision operation that doesn't
 *  define its own `workflowActivities` (Figma node 1312:12553). */
export const DEFAULT_DEPROVISION_WORKFLOW: WorkflowActivity[] = [
  {
    name: 'User Account Deprovisioning',
    timestamp: '12:05:43',
    policy: 'Built-in Policy - User Default Deprovisioning',
    notes: [
      'The user account is disabled',
      "The user account's DN is set to a random value",
      'User properties are changed.',
      'The user name is changed',
    ],
    change: { label: 'The user name is changed', oldValue: 'alexvu', newValue: 'alexvu - Deprovisioned' },
  },
  { name: 'Group Membership Removal', timestamp: '12:05:12', policy: 'Built-in Policy - User Default Deprovisioning', notes: ['All group memberships are removed.'] },
  { name: 'Exchange Mailbox Deprovisioning', timestamp: '12:05:43', policy: 'Built-in Policy - User Default Deprovisioning', notes: ['The Exchange mailbox is hidden from address lists.'] },
  { name: 'Home Folder Deprovisioning', timestamp: '12:05:43', policy: 'Built-in Policy - User Default Deprovisioning', notes: ["Access to the user's home folder is revoked."] },
  { name: 'User Account Realocation', timestamp: '12:05:43', policy: 'Built-in Policy - User Default Deprovisioning', notes: ['The account is moved to the Deprovisioned Users container.'] },
  { name: 'User Account Permanent Deletion', timestamp: '12:05:34', policy: 'Built-in Policy - User Default Deprovisioning', notes: ['The account is scheduled for permanent deletion after the retention period.'] },
];


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

// 'created' is deliberately absent here — Change History should show exactly
// one Create event (the object's own creation), not one scattered through
// every generated filler group. The sole Create lives in the hand-authored
// groups below.
const GENERATED_TYPES: { type: OperationType; label: string }[] = [
  { type: 'changeUser', label: 'Modify user' },
  { type: 'changeUser', label: 'Modify user' },
  { type: 'changeUser', label: 'Modify user' },
  { type: 'moved', label: 'Move user' },
  { type: 'renamed', label: 'Rename user' },
  { type: 'groupMembershipChange', label: 'Add group membership' },
  { type: 'deprovision', label: 'Deprovision user' },
  { type: 'undoDeprovision', label: 'Un-deprovision user' },
  { type: 'groupMembershipChange', label: 'Remove group membership' },
];

const GENERATED_STATUSES: OperationStatus[] = ['Completed', 'Pending', 'Denied', 'Canceled'];

// Named overrides for specific generated group-membership operations, so a
// handful of filler rows read as real stories instead of generic placeholders.
const GENERATED_GROUP_NAME_OVERRIDES: Record<number, string> = {
  3026: 'IT Security', // July 5, 2026 — Remove group membership
};

// Actor overrides for specific generated operations, e.g. to avoid a
// misleading actor for a particular story.
const GENERATED_ACTOR_OVERRIDES: Record<number, string> = {
  3062: 'administrator (O1D.local)', // May 30, 2026 — Remove group membership
};

// Cycled independently of type/actor/status (different length, so it
// doesn't line up with them) to give filler rows a realistic mix of blank
// and free-text reasons instead of every row reading '<none>'.
const GENERATED_REASONS: string[] = [
  '<none>',
  'Manager-approved role change',
  'Quarterly access recertification',
  'Employee transferred to a new team',
  'Routine access review',
  'Contractor engagement ended',
  'Self-service profile update',
];

function buildGeneratedOperation(dateLabel: string, seed: number): ChangeHistoryOperation {
  const { type, label: rawLabel } = GENERATED_TYPES[seed % GENERATED_TYPES.length];
  const opId = 3000 + seed;
  const actor = GENERATED_ACTOR_OVERRIDES[opId] ?? GENERATED_ACTORS[seed % GENERATED_ACTORS.length];
  const status = GENERATED_STATUSES[seed % GENERATED_STATUSES.length];
  const groupName = GENERATED_GROUP_NAME_OVERRIDES[opId] ?? `Group-${opId}`;
  const isRemove = rawLabel === 'Remove group membership';
  // Named after the group being joined/left, matching the console's
  // "Add <object> to <group>" convention (e.g. "Add user to VPN Users group").
  const label =
    type === 'groupMembershipChange'
      ? isRemove
        ? `Remove user from ${groupName} group`
        : `Add user to ${groupName} group`
      : rawLabel;
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
    reason: GENERATED_REASONS[seed % GENERATED_REASONS.length],
    requestedAt,
    logonComputer: seed % 2 === 0 ? 'ActiveRolesVm.O1D.local' : 'ActiveRolesVm2.O1D.local',
    logonSite: 'Default-First-Site-Name',
    activeRolesAdmin: seed % 3 === 0 ? 'Yes' : 'No',
    targetObject:
      type === 'groupMembershipChange'
        ? `${groupName} (O1D.local/Test OU)`
        : `user-${opId} (O1D.local/Test OU)`,
    lastUpdatedOn: requestedAt,
    // Create/Delete/Undo deprovision operations don't show a Properties
    // changed section in the sidesheet — they act on the whole object, not
    // individual properties.
    changes:
      type === 'created' || type === 'undoDeprovision' || type === 'deleted'
        ? []
        : type === 'groupMembershipChange'
          ? [
              {
                property: 'Member Of',
                attribute: '(memberOf)',
                changeNote: `${isRemove ? 'Remove' : 'Add'} value · Operation initiator`,
                oldValue: isRemove ? groupName : '<not a member>',
                newValue: isRemove ? '<not a member>' : groupName,
              },
            ]
          : type === 'renamed'
            ? [
                {
                  property: 'Full Name',
                  attribute: '(cn)',
                  changeNote: 'Replace value · Operation initiator',
                  oldValue: `user-${opId - 1}`,
                  newValue: `user-${opId}`,
                },
              ]
            : [
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
 *  operations, going backward from August 2026. */
function generateOlderGroups(count: number): ChangeHistoryGroup[] {
  const groups: ChangeHistoryGroup[] = [];
  const cursor = new Date(2026, 7, 1); // August 1, 2026 — just before the hand-authored groups
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
    date: 'September 2, 2026',
    operations: [
      {
        id: 'ID: 1-4098',
        time: '08:47:51',
        type: 'changeUser',
        label: 'Modify user',
        actor: 'sara.ito (O1D.local)',
        status: 'Pending',
        date: 'September 2, 2026',
        name: 'Isabella Clark (O1D.local/Test OU)',
        reason: 'Promotion to Senior Analyst approved by manager',
        requestedAt: 'September 2, 2026 08:47:51 UTC',
        logonComputer: 'ActiveRolesVm.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'No',
        targetObject: 'Isabella Clark (O1D.local/Test OU)',
        lastUpdatedOn: 'September 2, 2026 08:47:51 UTC',
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
      {
        id: 'ID: 1-4095',
        time: '07:30:12',
        type: 'groupMembershipChange',
        label: 'Add user to IT Support group',
        actor: 'administrator (O1D.local)',
        status: 'Completed',
        date: 'September 2, 2026',
        name: 'Isabella Clark (O1D.local/Test OU)',
        reason: 'New role requires IT Support access',
        requestedAt: 'September 2, 2026 07:30:12 UTC',
        logonComputer: 'ActiveRolesVm.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'Yes',
        targetObject: 'IT Support (O1D.local/Test OU)',
        lastUpdatedOn: 'September 2, 2026 07:30:12 UTC',
        changes: [
          {
            property: 'Member Of',
            attribute: '(memberOf)',
            changeNote: 'Add value · Operation initiator',
            oldValue: '<not a member>',
            newValue: 'IT Support',
          },
        ],
      },
      {
        id: 'ID: 1-4092',
        time: '06:15:45',
        type: 'changeUser',
        label: 'Modify user',
        actor: 'isabella.clark (O1D.local)',
        status: 'Completed',
        date: 'September 2, 2026',
        name: 'Isabella Clark (O1D.local/Test OU)',
        reason: 'Self-service profile update',
        requestedAt: 'September 2, 2026 06:15:45 UTC',
        logonComputer: 'ActiveRolesVm2.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'No',
        targetObject: 'Isabella Clark (O1D.local/Test OU)',
        lastUpdatedOn: 'September 2, 2026 06:15:45 UTC',
        changes: [
          {
            property: 'Phone Number',
            attribute: '(telephoneNumber)',
            changeNote: 'Replace value · Operation initiator',
            oldValue: '+1 555-0142',
            newValue: '+1 555-0198',
          },
        ],
      },
    ],
  },
  {
    date: 'August 29, 2026',
    operations: [
      {
        id: 'ID: 1-4061',
        time: '15:02:44',
        type: 'changeUser',
        label: 'Modify user',
        actor: 'administrator (O1D.local)',
        status: 'Completed',
        date: 'August 29, 2026',
        name: 'My OU (O1D.local/Test OU)',
        reason: 'Email address correction requested by employee',
        requestedAt: 'August 29, 2026 15:02:44 UTC',
        logonComputer: 'ActiveRolesVm.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'Yes',
        targetObject: 'Peter Kim (O1D.local/Test OU)',
        lastUpdatedOn: 'August 29, 2026 15:02:44 UTC',
        changes: [
          {
            property: 'E-Mail Address',
            attribute: '(mail)',
            changeNote: 'Replace value · Operation initiator',
            oldValue: 'noah.kim@saasii.io',
            newValue: 'noa.kim@saasii.io',
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
        date: 'August 29, 2026',
        name: 'Contractor Temp (O1D.local/Test OU)',
        reason: 'Contract extended - deprovisioning canceled by hiring manager',
        requestedAt: 'August 29, 2026 14:50:19 UTC',
        logonComputer: 'ActiveRolesVm2.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'No',
        targetObject: 'Contractor Temp (O1D.local/Test OU)',
        lastUpdatedOn: 'August 29, 2026 14:50:19 UTC',
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
        label: 'Delete user',
        actor: 'administrator (O1D.local)',
        status: 'Denied',
        date: 'August 29, 2026',
        name: 'svc-backup (O1D.local/Test OU)',
        reason: 'Account still in use by backup pipeline - request denied',
        requestedAt: 'August 29, 2026 14:42:12 UTC',
        logonComputer: 'ActiveRolesVm.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'Yes',
        targetObject: 'svc-backup (O1D.local/Test OU)',
        lastUpdatedOn: 'August 29, 2026 14:42:12 UTC',
        changes: [],
      },
    ],
  },
  {
    date: 'August 20, 2026',
    operations: [
      {
        id: 'ID: 1-4022',
        time: '11:15:37',
        type: 'changeUser',
        label: 'Modify user',
        actor: 'administrator (O1D.local)',
        status: 'Completed',
        date: 'August 20, 2026',
        name: 'Sara Ito (O1D.local/Test OU)',
        reason: 'New hire role assignment',
        requestedAt: 'August 20, 2026 11:15:37 UTC',
        logonComputer: 'ActiveRolesVm.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'Yes',
        targetObject: 'Sara Ito (O1D.local/Test OU)',
        lastUpdatedOn: 'August 20, 2026 11:15:37 UTC',
        changes: [
          {
            property: 'Job Title',
            attribute: '(title)',
            changeNote: 'Replace value · Operation initiator',
            oldValue: '<not set>',
            newValue: 'Support Specialist',
          },
        ],
      },
      {
        id: 'ID: 1-4018',
        time: '09:30:21',
        type: 'groupMembershipChange',
        label: 'Remove user from IT Support group',
        actor: 'administrator (O1D.local)',
        status: 'Completed',
        date: 'August 20, 2026',
        name: 'Peter Kim (O1D.local/Test OU)',
        reason: 'Team change - no longer requires IT Support access',
        requestedAt: 'August 20, 2026 09:30:21 UTC',
        logonComputer: 'ActiveRolesVm.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'Yes',
        targetObject: 'IT Support (O1D.local/Test OU)',
        lastUpdatedOn: 'August 20, 2026 09:30:21 UTC',
        changes: [
          {
            property: 'Member Of',
            attribute: '(memberOf)',
            changeNote: 'Remove value · Operation initiator',
            oldValue: 'IT Support',
            newValue: '<not a member>',
          },
        ],
      },
    ],
  },
  {
    // The object's own creation — the oldest, first-ever event, so it sits
    // right before the generated filler groups take over further back.
    date: 'August 1, 2026',
    operations: [
      {
        id: 'ID: 1-4102',
        time: '09:12:03',
        type: 'created',
        label: 'Create user',
        actor: 'administrator (O1D.local)',
        status: 'Completed',
        date: 'August 1, 2026',
        name: 'Peter Kim (O1D.local/Test OU)',
        reason: 'New hire onboarding',
        requestedAt: 'August 1, 2026 09:12:03 UTC',
        logonComputer: 'ActiveRolesVm.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'Yes',
        targetObject: 'Peter Kim (O1D.local/Test OU)',
        lastUpdatedOn: 'August 1, 2026 09:12:03 UTC',
        changes: [],
      },
    ],
  },
  ...generateOlderGroups(40),
];

/** Mock data for the "User Activity" view (Figma node 1412:25122,
 *  "ARS_User activity_Ouick_Filtering") — reuses the same Timeline UI,
 *  quick-filter chips, and operation/status vocabulary as Change History,
 *  just scoped to the user's own self-service actions rather than admin
 *  changes made to their account. */
export const MOCK_USER_ACTIVITY: ChangeHistoryGroup[] = [
  {
    date: 'September 1, 2026',
    operations: [
      {
        id: 'ID: 1-5104',
        time: '08:55:12',
        type: 'changeUser',
        label: 'Modify user',
        actor: 'isabella.clark (O1D.local)',
        status: 'Completed',
        date: 'September 1, 2026',
        name: 'Isabella Clark (O1D.local/Test OU)',
        reason: 'Self-service password reset',
        requestedAt: 'September 1, 2026 08:55:12 UTC',
        logonComputer: 'WKS-ICLARK.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'No',
        targetObject: 'Isabella Clark (O1D.local/Test OU)',
        lastUpdatedOn: 'September 1, 2026 08:55:12 UTC',
        changes: [
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
        id: 'ID: 1-5098',
        time: '08:40:03',
        type: 'undoDeprovision',
        label: 'Un-deprovision user',
        actor: 'isabella.clark (O1D.local)',
        status: 'Completed',
        date: 'September 1, 2026',
        name: 'Isabella Clark (O1D.local/Test OU)',
        reason: 'Self-service account unlock',
        requestedAt: 'September 1, 2026 08:40:03 UTC',
        logonComputer: 'WKS-ICLARK.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'No',
        targetObject: 'Isabella Clark (O1D.local/Test OU)',
        lastUpdatedOn: 'September 1, 2026 08:40:03 UTC',
        changes: [],
      },
    ],
  },
  {
    date: 'August 29, 2026',
    operations: [
      {
        id: 'ID: 1-5080',
        time: '10:22:15',
        type: 'created',
        label: 'Create user',
        actor: 'isabella.clark (O1D.local)',
        status: 'Completed',
        date: 'August 29, 2026',
        name: 'Marketing Interns 2026 (O1D.local/Test OU)',
        reason: 'New seasonal access group for marketing interns',
        requestedAt: 'August 29, 2026 10:22:15 UTC',
        logonComputer: 'WKS-ICLARK.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'No',
        targetObject: 'Marketing Interns 2026 (O1D.local/Test OU)',
        lastUpdatedOn: 'August 29, 2026 10:22:15 UTC',
        changes: [],
      },
      {
        id: 'ID: 1-5077',
        time: '09:48:02',
        type: 'created',
        label: 'Create user',
        actor: 'administrator (O1D.local)',
        status: 'Completed',
        date: 'August 29, 2026',
        name: 'svc-reporting-automation (O1D.local/Test OU)',
        reason: 'Created on behalf of the user for the reporting automation project',
        requestedAt: 'August 29, 2026 09:48:02 UTC',
        logonComputer: 'ActiveRolesVm.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'Yes',
        targetObject: 'svc-reporting-automation (O1D.local/Test OU)',
        lastUpdatedOn: 'August 29, 2026 09:48:02 UTC',
        changes: [],
      },
    ],
  },
  {
    date: 'August 25, 2026',
    operations: [
      {
        id: 'ID: 1-5061',
        time: '17:20:47',
        type: 'groupMembershipChange',
        label: 'Add user to VPN Users group',
        actor: 'isabella.clark (O1D.local)',
        status: 'Pending',
        date: 'August 25, 2026',
        name: 'Isabella Clark (O1D.local/Test OU)',
        reason: 'Access request approval',
        requestedAt: 'August 25, 2026 17:20:47 UTC',
        logonComputer: 'WKS-ICLARK.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'No',
        targetObject: 'VPN Users (O1D.local/Test OU)',
        lastUpdatedOn: 'August 25, 2026 17:20:47 UTC',
        changes: [
          {
            property: 'Member Of',
            attribute: '(memberOf)',
            changeNote: 'Add value · Operation initiator',
            oldValue: '<not a member>',
            newValue: 'VPN Users',
          },
        ],
      },
      {
        id: 'ID: 1-5058',
        time: '17:45:02',
        type: 'groupMembershipChange',
        label: 'Remove user from Legacy Contractors group',
        actor: 'isabella.clark (O1D.local)',
        status: 'Completed',
        date: 'August 25, 2026',
        name: 'Isabella Clark (O1D.local/Test OU)',
        reason: 'Access review cleanup',
        requestedAt: 'August 25, 2026 17:45:02 UTC',
        logonComputer: 'WKS-ICLARK.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'No',
        targetObject: 'Legacy Contractors (O1D.local/Test OU)',
        lastUpdatedOn: 'August 25, 2026 17:45:02 UTC',
        changes: [
          {
            property: 'Member Of',
            attribute: '(memberOf)',
            changeNote: 'Remove value · Operation initiator',
            oldValue: 'Legacy Contractors',
            newValue: '<not a member>',
          },
        ],
      },
      {
        id: 'ID: 1-5055',
        time: '09:05:30',
        type: 'changeUser',
        label: 'Modify user',
        actor: 'isabella.clark (O1D.local)',
        status: 'Completed',
        date: 'August 25, 2026',
        name: 'Isabella Clark (O1D.local/Test OU)',
        reason: 'Self-service profile update',
        requestedAt: 'August 25, 2026 09:05:30 UTC',
        logonComputer: 'WKS-ICLARK.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'No',
        targetObject: 'Isabella Clark (O1D.local/Test OU)',
        lastUpdatedOn: 'August 25, 2026 09:05:30 UTC',
        changes: [
          {
            property: 'Mobile Phone',
            attribute: '(mobile)',
            changeNote: 'Replace value · Operation initiator',
            oldValue: '<not set>',
            newValue: '+1 555-0114',
          },
        ],
      },
    ],
  },
  {
    date: 'August 17, 2026',
    operations: [
      {
        id: 'ID: 1-5030',
        time: '13:12:09',
        type: 'deprovision',
        label: 'Deprovision user',
        actor: 'isabella.clark (O1D.local)',
        status: 'Denied',
        date: 'August 17, 2026',
        name: 'Isabella Clark (O1D.local/Test OU)',
        reason: 'Self-service account deactivation request',
        requestedAt: 'August 17, 2026 13:12:09 UTC',
        logonComputer: 'WKS-ICLARK.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'No',
        targetObject: 'Isabella Clark (O1D.local/Test OU)',
        lastUpdatedOn: 'August 17, 2026 13:12:09 UTC',
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
        id: 'ID: 1-5024',
        time: '10:04:47',
        type: 'deleted',
        label: 'Delete user',
        actor: 'isabella.clark (O1D.local)',
        status: 'Completed',
        date: 'August 17, 2026',
        name: 'Isabella Clark (O1D.local/Test OU)',
        reason: 'Self-service revoke expired access request',
        requestedAt: 'August 17, 2026 10:04:47 UTC',
        logonComputer: 'WKS-ICLARK.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'No',
        targetObject: 'Access Request #4821 (O1D.local/Test OU)',
        lastUpdatedOn: 'August 17, 2026 10:04:47 UTC',
        changes: [],
      },
    ],
  },
  {
    date: 'August 9, 2026',
    operations: [
      {
        id: 'ID: 1-5017',
        time: '16:38:29',
        type: 'deleted',
        label: 'Delete user',
        actor: 'administrator (O1D.local)',
        status: 'Completed',
        date: 'August 9, 2026',
        name: 'Isabella Clark (O1D.local/Test OU)',
        reason: 'Admin removed unused MFA device',
        requestedAt: 'August 9, 2026 16:38:29 UTC',
        logonComputer: 'ActiveRolesVm.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'Yes',
        targetObject: 'MFA Device - iPhone 14 (O1D.local/Test OU)',
        lastUpdatedOn: 'August 9, 2026 16:38:29 UTC',
        changes: [],
      },
    ],
  },
  {
    date: 'August 1, 2026',
    operations: [
      {
        id: 'ID: 1-5009',
        time: '11:52:03',
        type: 'deleted',
        label: 'Delete user',
        actor: 'peter.kim (O1D.local)',
        status: 'Denied',
        date: 'August 1, 2026',
        name: 'Isabella Clark (O1D.local/Test OU)',
        reason: 'Helpdesk removed stale access token on request',
        requestedAt: 'August 1, 2026 11:52:03 UTC',
        logonComputer: 'ActiveRolesVm2.O1D.local',
        logonSite: 'Default-First-Site-Name',
        activeRolesAdmin: 'No',
        targetObject: 'Access Token - CI Pipeline (O1D.local/Test OU)',
        lastUpdatedOn: 'August 1, 2026 11:52:03 UTC',
        changes: [],
      },
    ],
  },
];


