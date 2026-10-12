// Inline SVG icon set (no emoji, no icon fonts).
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { className?: string };

const base = (props: P) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
);

export const IconCart = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8z" />
    <path d="M8.5 10V6a3.5 3.5 0 0 1 7 0v4" />
  </svg>
);

export const IconGift = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="8" width="18" height="4" />
    <path d="M5 12v9h14v-9M12 8v13M12 8s-1.5-4-4.5-4S5 8 12 8zm0 0s1.5-4 4.5-4S19 8 12 8z" />
  </svg>
);

export const IconFlash = (p: P) => (
  <svg {...base(p)}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const IconChip = (p: P) => (
  <svg {...base(p)}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <rect x="10" y="10" width="4" height="4" />
    <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
  </svg>
);

export const IconCompare = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 3H4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 3h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
    <path d="M12 2v20" strokeDasharray="2 2" />
  </svg>
);

export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
  </svg>
);

export const IconPhone = (p: P) => (
  <svg {...base(p)}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />
  </svg>
);

export const IconPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const IconChevronDown = (p: P) => (
  <svg {...base(p)}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const IconChevronRight = (p: P) => (
  <svg {...base(p)}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const IconChevronLeft = (p: P) => (
  <svg {...base(p)}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const IconHeart = (p: P) => (
  <svg {...base(p)}>
    <path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 1 1 12 6.1a5 5 0 1 1 7.5 6.5z" />
  </svg>
);

export const IconHeartSolid = (p: P) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 1 1 12 6.1a5 5 0 1 1 7.5 6.5z" />
  </svg>
);

export const IconShare = (p: P) => (
  <svg {...base(p)}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
    <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
  </svg>
);

export const IconStar = (p: P) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" />
  </svg>
);

export const IconStarOutline = (p: P) => (
  <svg {...base(p)}>
    <polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" />
  </svg>
);

export const IconTruck = (p: P) => (
  <svg {...base(p)}>
    <rect x="1" y="5" width="14" height="11" rx="1" />
    <path d="M15 9h4l4 4v3h-8" />
    <circle cx="6" cy="18.5" r="1.8" />
    <circle cx="18" cy="18.5" r="1.8" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
    <polyline points="9 11.5 11 13.5 15 9.5" />
  </svg>
);

export const IconHeadset = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 13a8 8 0 0 1 16 0" />
    <rect x="2" y="13" width="4" height="7" rx="1.5" />
    <rect x="18" y="13" width="4" height="7" rx="1.5" />
    <path d="M20 20a4 4 0 0 1-4 3h-2" />
  </svg>
);

export const IconCash = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

export const IconFilter = (p: P) => (
  <svg {...base(p)}>
    <polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3" />
  </svg>
);

export const IconHome = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
);

export const IconMinus = (p: P) => (
  <svg {...base(p)}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const IconBox = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7V8z" />
    <polyline points="3.3 7 12 12 20.7 7" />
    <line x1="12" y1="22" x2="12" y2="12" />
  </svg>
);

export const IconTag = (p: P) => (
  <svg {...base(p)}>
    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
    <circle cx="7.5" cy="7.5" r="1.2" />
  </svg>
);

export const IconStore = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 9l1.5-5h15L21 9M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9M3 9h18M9 21v-6h6v6" />
  </svg>
);

export const IconLaptop = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="11" rx="1" />
    <path d="M2 19h20" />
  </svg>
);

export const IconMonitor = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="4" width="20" height="13" rx="1" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

export const IconDesktop = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="3" width="8" height="18" rx="1" />
    <rect x="13" y="6" width="9" height="12" rx="1" />
    <path d="M6 6.5h.01M6 10h.01" />
  </svg>
);

export const IconHeadphones = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 15v-2a8 8 0 0 1 16 0v2" />
    <rect x="2" y="15" width="4" height="6" rx="1.5" />
    <rect x="18" y="15" width="4" height="6" rx="1.5" />
  </svg>
);

export const IconWatch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="6" />
    <path d="M12 10v2l1.5 1.5M9 2h6M9 22h6" />
  </svg>
);

export const IconMobile = (p: P) => (
  <svg {...base(p)}>
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <line x1="11" y1="18.5" x2="13" y2="18.5" />
  </svg>
);

export const IconBattery = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="8" width="17" height="9" rx="2" />
    <line x1="22" y1="11" x2="22" y2="14" />
    <line x1="6.5" y1="11" x2="6.5" y2="14" />
    <line x1="10.5" y1="11" x2="10.5" y2="14" />
  </svg>
);

export const IconPrinter = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="7" />
  </svg>
);

export const IconDisc = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

export const IconWrench = (p: P) => (
  <svg {...base(p)}>
    <path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7z" />
  </svg>
);

export const IconArrowRight = (p: P) => (
  <svg {...base(p)}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const IconMail = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);

/* ---- social (simplified brand glyphs) ---- */

export const IconFacebook = (p: P) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z" />
  </svg>
);

export const IconYoutube = (p: P) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M22 12s0-3.3-.4-4.8a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.7 2 12 2 12s0 3.3.4 4.8c.2.9.9 1.6 1.8 1.8 1.5.4 7.8.4 7.8.4s6.3 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.5.4-4.8.4-4.8zM10 15.2V8.8L15.5 12 10 15.2z" />
  </svg>
);

export const IconInstagram = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconWhatsapp = (p: P) => (
  <svg {...base(p)}>
    <path d="M21 12a9 9 0 0 1-13.2 8L3 21l1.1-4.4A9 9 0 1 1 21 12z" />
    <path d="M9 9.5c.5 2.5 3 5 5.5 5.5l1-1.5 2 1c-.5 1.5-1.5 2-3 1.5-3-1-6-4-7-7-.5-1.5 0-2.5 1.5-3l1 2L9 9.5z" />
  </svg>
);

/* ---------- payment brand icons ---------- */

export const IconBkash = (p: P) => (
  <svg viewBox="0 0 48 32" fill="none" {...p}>
    <rect width="48" height="32" rx="4" fill="#E2136E" />
    <text x="24" y="21" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial,sans-serif">bKash</text>
  </svg>
);

export const IconNagad = (p: P) => (
  <svg viewBox="0 0 48 32" fill="none" {...p}>
    <rect width="48" height="32" rx="4" fill="#F6921E" />
    <text x="24" y="21" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial,sans-serif">Nagad</text>
  </svg>
);

export const IconRocket = (p: P) => (
  <svg viewBox="0 0 48 32" fill="none" {...p}>
    <rect width="48" height="32" rx="4" fill="#8C3494" />
    <text x="24" y="21" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial,sans-serif">Rocket</text>
  </svg>
);

export const IconVisa = (p: P) => (
  <svg viewBox="0 0 48 32" fill="none" {...p}>
    <rect width="48" height="32" rx="4" fill="white" stroke="#ddd" strokeWidth="1" />
    <text x="24" y="22" textAnchor="middle" fill="#1A1F71" fontSize="13" fontWeight="bold" fontStyle="italic" fontFamily="Arial,sans-serif">VISA</text>
  </svg>
);

export const IconMastercard = (p: P) => (
  <svg viewBox="0 0 48 32" fill="none" {...p}>
    <rect width="48" height="32" rx="4" fill="white" stroke="#ddd" strokeWidth="1" />
    <circle cx="20" cy="16" r="8" fill="#EB001B" />
    <circle cx="28" cy="16" r="8" fill="#F79E1B" fillOpacity="0.8" />
  </svg>
);

export const IconAmex = (p: P) => (
  <svg viewBox="0 0 48 32" fill="none" {...p}>
    <rect width="48" height="32" rx="4" fill="#2E77BC" />
    <text x="24" y="21" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial,sans-serif">AMEX</text>
  </svg>
);

export const IconDbblNexus = (p: P) => (
  <svg viewBox="0 0 48 32" fill="none" {...p}>
    <rect width="48" height="32" rx="4" fill="#006A4E" />
    <text x="24" y="18" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial,sans-serif">DBBL</text>
    <text x="24" y="27" textAnchor="middle" fill="white" fontSize="7" fontFamily="Arial,sans-serif">Nexus</text>
  </svg>
);
