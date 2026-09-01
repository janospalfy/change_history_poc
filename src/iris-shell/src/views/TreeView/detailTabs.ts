import type { TabItem } from '../../components/Tabs/Tabs.js';
import type { DirectoryObjectType } from '../../lib/directoryData.js';

/**
 * Per-object-type tab sets for the Tree detail page. `General` is the primary
 * tab (renders real content); the rest are "Coming soon" stubs, mirroring how
 * `UserDetailPage` stubs its non-overview tabs.
 */

const USER_TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'general', label: 'General' },
  { value: 'user-details', label: 'User details' },
  { value: 'account', label: 'Account' },
  { value: 'connections', label: 'Connections' },
  { value: 'memberships', label: 'Memberships' },
  { value: 'managed-units', label: 'Managed units' },
  { value: 'roles', label: 'Roles' },
  { value: 'authorization', label: 'Authorization' },
  { value: 'object', label: 'Object' },
  { value: 'history', label: 'History' },
];

const COMPUTER_TABS: TabItem[] = [
  { value: 'overview', label: 'Overview', icon: 'Briefcase' },
  { value: 'general', label: 'General', icon: 'Devices' },
  { value: 'operating-system', label: 'Operating system', icon: 'Cube' },
  { value: 'connections', label: 'Connections', icon: 'Plugs' },
  { value: 'object', label: 'Object', icon: 'Cube' },
  { value: 'history', label: 'History', icon: 'ClockCounterClockwise' },
];

const GROUP_TABS: TabItem[] = [
  { value: 'overview', label: 'Overview', icon: 'Briefcase' },
  { value: 'general', label: 'General', icon: 'UsersThree' },
  { value: 'members', label: 'Members', icon: 'Users' },
  { value: 'managed-units', label: 'Managed units', icon: 'FolderStar' },
  { value: 'object', label: 'Object', icon: 'Cube' },
  { value: 'history', label: 'History', icon: 'ClockCounterClockwise' },
];

const CONTAINER_TABS: TabItem[] = [
  { value: 'overview', label: 'Overview', icon: 'Briefcase' },
  { value: 'general', label: 'General', icon: 'IdentificationCard' },
  { value: 'object', label: 'Object', icon: 'Cube' },
  { value: 'history', label: 'History', icon: 'ClockCounterClockwise' },
];

const TABS_BY_TYPE: Record<DirectoryObjectType, TabItem[]> = {
  user: USER_TABS,
  contact: USER_TABS,
  computer: COMPUTER_TABS,
  group: GROUP_TABS,
  gmsa: GROUP_TABS,
  agent: CONTAINER_TABS,
  application: CONTAINER_TABS,
  ou: CONTAINER_TABS,
  container: CONTAINER_TABS,
};

/** The primary (content-bearing) tab value for every type. */
export const PRIMARY_TAB = 'general';

export function tabsForType(type: DirectoryObjectType): TabItem[] {
  return TABS_BY_TYPE[type] ?? CONTAINER_TABS;
}
