import { memo, useMemo } from 'react';
import { Icon } from '@iconify/react';

interface ConceptIconProps {
  name: string;
  size?: number;
  className?: string;
}

const CONCEPT_ICONS: Record<string, { icon: string; animated?: string }> = {
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

function ConceptIconComponent({ name, size = 24, className = '' }: ConceptIconProps) {
  const conceptData = useMemo(() => CONCEPT_ICONS[name], [name]);

  if (!conceptData) {
    return (
      <div
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: '#cccccc',
          borderRadius: '4px',
        }}
      />
    );
  }

  const animationClass = conceptData.animated || '';

  return (
    <div
      className={`${className} ${animationClass} flex items-center justify-center`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <Icon icon={conceptData.icon} width={size} height={size} />
    </div>
  );
}

export const ConceptIcon = memo(ConceptIconComponent);
