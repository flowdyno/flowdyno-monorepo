export interface ConceptIconConfig {
  icon: string;
  animated?: string;
}

export interface ConceptCategory {
  id: string;
  label: string;
  icons: Array<{ id: string; label: string; icon: string }>;
}

export const CONCEPT_ICONS: Record<string, ConceptIconConfig> = {
  // Users & Roles
  user: { icon: 'twemoji:bust-in-silhouette' },
  admin: { icon: 'twemoji:man-technologist' },
  team: { icon: 'twemoji:busts-in-silhouette' },
  customer: { icon: 'twemoji:person-raising-hand' },

  // Devices
  mobile: { icon: 'twemoji:mobile-phone', animated: 'animate-pulse' },
  computer: { icon: 'twemoji:laptop' },
  tablet: { icon: 'twemoji:tablet' },
  watch: { icon: 'twemoji:watch' },

  // Infrastructure
  'server-hardware': { icon: 'twemoji:desktop-computer', animated: 'animate-pulse' },
  cloud: { icon: 'twemoji:cloud' },
  network: { icon: 'twemoji:globe-with-meridians' },
  datacenter: { icon: 'twemoji:office-building' },

  // Data & Storage
  storage: { icon: 'twemoji:floppy-disk' },
  database: { icon: 'twemoji:card-file-box' },
  backup: { icon: 'twemoji:package' },
  archive: { icon: 'twemoji:file-cabinet' },

  // Documents & Content
  document: { icon: 'twemoji:page-facing-up' },
  note: { icon: 'twemoji:memo' },
  spreadsheet: { icon: 'twemoji:bar-chart' },
  presentation: { icon: 'twemoji:chart-increasing-with-yen' },
  pdf: { icon: 'twemoji:page-with-curl' },

  // Communication
  email: { icon: 'twemoji:envelope' },
  message: { icon: 'twemoji:speech-balloon' },
  notification: { icon: 'twemoji:bell', animated: 'animate-bounce' },
  chat: { icon: 'twemoji:left-speech-bubble' },

  // Development
  'code-block': { icon: 'twemoji:laptop' },
  compiler: { icon: 'twemoji:gear', animated: 'animate-pulse' },
  toolbox: { icon: 'twemoji:toolbox' },
  terminal: { icon: 'twemoji:desktop-computer' },
  git: { icon: 'twemoji:package' },

  // AI & Automation
  prompt: { icon: 'twemoji:speech-balloon' },
  ai: { icon: 'twemoji:robot', animated: 'animate-pulse' },
  automation: { icon: 'twemoji:gear', animated: 'animate-spin' },
  workflow: { icon: 'twemoji:clockwise-vertical-arrows' },

  // Analytics & Monitoring
  chart: { icon: 'twemoji:chart-increasing', animated: 'animate-bounce' },
  dashboard: { icon: 'twemoji:control-knobs' },
  metrics: { icon: 'twemoji:chart-decreasing' },
  logs: { icon: 'twemoji:scroll' },

  // Security
  security: { icon: 'twemoji:locked' },
  key: { icon: 'twemoji:key' },
  shield: { icon: 'twemoji:shield' },
  firewall: { icon: 'twemoji:brick' },

  // Status & Process
  loading: { icon: 'twemoji:hourglass-not-done', animated: 'animate-spin' },
  success: { icon: 'twemoji:check-mark-button' },
  error: { icon: 'twemoji:cross-mark' },
  warning: { icon: 'twemoji:warning' },

  // Business
  payment: { icon: 'twemoji:credit-card' },
  money: { icon: 'twemoji:money-bag' },
  invoice: { icon: 'twemoji:receipt' },
  cart: { icon: 'twemoji:shopping-cart' },
};

export const CONCEPT_CATEGORIES: ConceptCategory[] = [
  {
    id: 'concept-users',
    label: 'Users & Roles',
    icons: [
      { id: 'user', label: 'User', icon: 'user' },
      { id: 'admin', label: 'Admin', icon: 'admin' },
      { id: 'team', label: 'Team', icon: 'team' },
      { id: 'customer', label: 'Customer', icon: 'customer' },
    ],
  },
  {
    id: 'concept-devices',
    label: 'Devices',
    icons: [
      { id: 'mobile', label: 'Mobile', icon: 'mobile' },
      { id: 'computer', label: 'Computer', icon: 'computer' },
      { id: 'tablet', label: 'Tablet', icon: 'tablet' },
      { id: 'watch', label: 'Watch', icon: 'watch' },
    ],
  },
  {
    id: 'concept-infrastructure',
    label: 'Infrastructure',
    icons: [
      { id: 'server-hardware', label: 'Server', icon: 'server-hardware' },
      { id: 'cloud', label: 'Cloud', icon: 'cloud' },
      { id: 'network', label: 'Network', icon: 'network' },
      { id: 'datacenter', label: 'Data Center', icon: 'datacenter' },
    ],
  },
  {
    id: 'concept-data',
    label: 'Data & Storage',
    icons: [
      { id: 'storage', label: 'Storage', icon: 'storage' },
      { id: 'database', label: 'Database', icon: 'database' },
      { id: 'backup', label: 'Backup', icon: 'backup' },
      { id: 'archive', label: 'Archive', icon: 'archive' },
    ],
  },
  {
    id: 'concept-documents',
    label: 'Documents',
    icons: [
      { id: 'document', label: 'Document', icon: 'document' },
      { id: 'note', label: 'Note', icon: 'note' },
      { id: 'spreadsheet', label: 'Spreadsheet', icon: 'spreadsheet' },
      { id: 'presentation', label: 'Presentation', icon: 'presentation' },
      { id: 'pdf', label: 'PDF', icon: 'pdf' },
    ],
  },
  {
    id: 'concept-communication',
    label: 'Communication',
    icons: [
      { id: 'email', label: 'Email', icon: 'email' },
      { id: 'message', label: 'Message', icon: 'message' },
      { id: 'notification', label: 'Notification', icon: 'notification' },
      { id: 'chat', label: 'Chat', icon: 'chat' },
    ],
  },
];
