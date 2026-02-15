import React from 'react';

interface IconProps {
  className?: string;
  animate?: boolean;
}

export const FireIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} ${animate ? 'animate-float' : ''}`}
  >
    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 2.08 13.5.67zM12 19c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
  </svg>
);

export const LockIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} ${animate ? 'animate-pulse' : ''}`}
  >
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5s-5 2.24-5 5v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
  </svg>
);

export const UnlockIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} ${animate ? 'animate-pulse' : ''}`}
  >
    <path d="M12 1C5.9 1 1 5.9 1 12s4.9 11 11 11 11-4.9 11-11S18.1 1 12 1zm0 20c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 9 15.5 9 14 9.67 14 10.5s.67 1.5 1.5 1.5z" />
  </svg>
);

export const CheckIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} ${animate ? 'animate-bounce' : ''}`}
  >
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
  </svg>
);

export const DownloadIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} ${animate ? 'animate-bounce' : ''}`}
  >
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

export const UploadIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} ${animate ? 'animate-bounce' : ''}`}
  >
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17zM19 5h-6V3h-2v2H5v2h6v6h2V7h6V5z" />
  </svg>
);

export const DeleteIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} ${animate ? 'hover:scale-110 transition-transform' : ''}`}
  >
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
  </svg>
);

export const AdminIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} ${animate ? 'animate-float' : ''}`}
  >
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
  </svg>
);

export const LogoutIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
  </svg>
);

export const FileIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z" />
  </svg>
);

export const AnnouncementIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} ${animate ? 'animate-pulse' : ''}`}
  >
    <path d="M11 23c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm7-4v-6h-4.18C13.45 16.82 12.31 18 11 18s-2.45-1.18-2.82-3H4v6h14zm0-10h-6.7c-.29-.58-.78-1.04-1.3-1.33V5c0-.83-.67-1.5-1.5-1.5S8 4.17 8 5v6.67c-.52.29-1.01.75-1.3 1.33H4v2h6.7c.3.61.81 1.07 1.3 1.33V19h2v-4c.49-.26 1-.72 1.3-1.33H20v-2z" />
  </svg>
);

export const TimerIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} ${animate ? 'animate-spin' : ''}`}
  >
    <path d="M15 1H9v2h6V1zm4.03 6.39l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8c0-2.12-.74-4.07-1.97-5.61zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm.5-8H11v6h1.5z" />
  </svg>
);

export const FolderIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
  </svg>
);

export const ArrowIcon = ({ className = 'w-6 h-6', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className={`${className} ${animate ? 'group-hover:translate-x-2 transition-transform' : ''}`}
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export const LoadingSpinner = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className={`${className} animate-spin`}
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export const LightBulbIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} ${animate ? 'animate-pulse' : ''}`}
  >
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
  </svg>
);

export const EyeIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} ${animate ? 'animate-pulse' : ''}`}
  >
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
  </svg>
);

export const HourglassIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} ${animate ? 'animate-bounce' : ''}`}
  >
    <path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z" />
  </svg>
);

export const CelebrationIcon = ({ className = 'w-8 h-8', animate = false }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`${className} ${animate ? 'animate-bounce' : ''}`}
  >
    <path d="M2 20h2c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1H2v-2h2c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1H2V9h2c.55 0 1-.45 1-1V7c0-.55-.45-1-1-1H2V4h2c.55 0 1-.45 1-1V2H3c-.55 0-1 .45-1 1v1H0v2h2v2H0v2h2v2H0v2h2v2H0v2h2v1c0 .55.45 1 1 1zm20-11.5c0-.83-.67-1.5-1.5-1.5h-3c-.83 0-1.5.67-1.5 1.5V10h6v-1.5zm-1.5 5.5H14v6c0 .55.45 1 1 1h5c.55 0 1-.45 1-1v-6h-1.5zM11 9H7.5C6.67 9 6 9.67 6 10.5V12h6v-1.5c0-.83-.67-1.5-1.5-1.5H11zm-.5 5H6v6c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-6h-.5z" />
  </svg>
);
