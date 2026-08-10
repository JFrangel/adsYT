import React from 'react';

/**
 * Set de iconos de trazo sobre rejilla de 24.
 *
 * Todos comparten grosor (1.75), remates redondeados y viewBox, así que pesan
 * lo mismo ópticamente y siguen siendo legibles a 16px — donde un glifo
 * relleno pierde su detalle interno y se lee como una mancha.
 *
 * El grosor coincide con el anillo de progreso del TimerButton para que ese
 * elemento se lea como parte del sistema y no como una excepción.
 */

interface IconProps {
  className?: string;
  animate?: boolean;
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const FireIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export const LockIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3" y="10.5" width="18" height="10.5" rx="2" />
    <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
  </svg>
);

export const CheckIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m20 6-11 11-5-5" />
  </svg>
);

export const ArrowIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const DownloadIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" />
    <path d="M20 16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3" />
  </svg>
);

export const UploadIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 15V3M7.5 7.5 12 3l4.5 4.5" />
    <path d="M20 16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3" />
  </svg>
);

/** Megáfono: el paso del anuncio. */
export const AnnouncementIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m4 10 14-5.5v15L4 14z" />
    <path d="M4 10H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1" />
    <path d="M11.5 16.2v1.3a2.5 2.5 0 0 1-5 0v-2.4" />
  </svg>
);

export const FolderIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M20 20a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7.5l-1.7-2.1A2 2 0 0 0 9.2 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
  </svg>
);

export const FileIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </svg>
);

export const DeleteIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3.5 6.5h17M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5" />
    <path d="M18.5 6.5 17.8 19a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5.5 6.5" />
    <path d="M10 10.5v6M14 10.5v6" />
  </svg>
);

/** Escudo: zona restringida (admin). */
export const AdminIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 3 4.5 6v6c0 4.2 3 7.6 7.5 9 4.5-1.4 7.5-4.8 7.5-9V6z" />
  </svg>
);

export const LogoutIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M9.5 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.5" />
    <path d="M16 16.5 20.5 12 16 7.5M20.5 12h-11" />
  </svg>
);

export const LoadingSpinner = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg {...base} className={`${className} animate-spin`}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
);
