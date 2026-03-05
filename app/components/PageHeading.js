'use client'

import { usePathname } from 'next/navigation';
import { useSettings } from './SettingsProvider';

export default function PageHeading({ children, className = '' }) {
  const pathname = usePathname();
  const { settings } = useSettings();
  const color = settings.headingColors?.[pathname];

  return (
    <h1
      className={`text-2xl font-bold tracking-wide ${className}`}
      style={color ? { color } : undefined}
    >
      {children}
    </h1>
  );
}
