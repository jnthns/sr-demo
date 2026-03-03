'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSettings } from './SettingsProvider';

export default function Navigation() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { openSettings } = useSettings();

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setCollapsed(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const navItems = [
    { href: '/', label: 'Experiments', icon: ExperimentIcon },
    { href: '/cart-analysis', label: 'Cart Arrays', icon: CartIcon },
    { href: '/chat', label: 'Chat', icon: ChatIcon },
    { href: '/store', label: 'Store', icon: StoreIcon },
    { href: '/filesearch', label: 'File Search', icon: FileIcon },
    { href: '/amplitude', label: 'Amplitude APIs', icon: ApiIcon },
    { href: '/notes', label: 'Account Notes', icon: NotesIcon },
  ];

  return (
    <aside
      className={`sticky top-0 h-screen flex-shrink-0 flex flex-col bg-zen-100 glass border-r border-zen-200 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Brand + collapse toggle */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-zen-200 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-matcha-500 to-glow-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-matcha-500/20">
            A
          </span>
          {!collapsed && (
            <span className="text-sm font-semibold text-zen-800 truncate tracking-wide">
              Amplitude Demo
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-zen-400 hover:text-zen-700 hover:bg-zen-200 transition"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 transition-transform duration-200 ${
              collapsed ? 'rotate-180' : ''
            }`}
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg transition-all duration-150 ${
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-matcha-100 text-matcha-400 font-medium'
                  : 'text-zen-500 hover:text-zen-800 hover:bg-zen-200'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="flex-shrink-0 border-t border-zen-200 px-2 py-3">
        <button
          onClick={openSettings}
          title={collapsed ? 'Settings' : undefined}
          className={`flex items-center gap-3 rounded-lg transition-all duration-150 w-full text-zen-500 hover:text-zen-800 hover:bg-zen-200 ${
            collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
          }`}
        >
          <SettingsIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Settings</span>}
        </button>
      </div>
    </aside>
  );
}

function ExperimentIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm-2.5 3A1.5 1.5 0 017 4.5h6A1.5 1.5 0 0114.5 6v1.028a4.5 4.5 0 01-2 3.745V17.5a.5.5 0 01-.5.5H8a.5.5 0 01-.5-.5v-6.727a4.5 4.5 0 01-2-3.745V6z" clipRule="evenodd" />
    </svg>
  );
}

function CartIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M1 1.75A.75.75 0 011.75 1h1.628a1.75 1.75 0 011.734 1.51L5.18 3H17.25a.75.75 0 01.727.932l-1.587 6.348A1.75 1.75 0 0114.706 12H6.794a1.75 1.75 0 01-1.684-1.28L3.539 3.25h-1.79A.75.75 0 011 2.5V1.75zM6 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8.5-1.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function ChatIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 01-3.55.414l-3.56 2.966A.75.75 0 018.21 16.5v-2.622a41.29 41.29 0 01-4.78-.938C2.065 12.648 1 11.39 1 9.976V5.426c0-1.413.993-2.67 2.43-2.902z" clipRule="evenodd" />
    </svg>
  );
}

function StoreIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M.99 5.24A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25l.01 9.5A2.25 2.25 0 0116.76 17H3.26A2.25 2.25 0 011 14.75V5.25zm8.26 9.52v-.625a.75.75 0 00-.75-.75H3.25a.75.75 0 00-.75.75v.615c0 .414.336.75.75.75h5.373a.75.75 0 00.627-.34zm1.5 0a.75.75 0 00.627.34h5.373a.75.75 0 00.75-.75v-.615a.75.75 0 00-.75-.75H11.5a.75.75 0 00-.75.75v.625z" clipRule="evenodd" />
    </svg>
  );
}

function FileIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0116 6.622V16.5a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 013 16.5v-13zM6 8a.75.75 0 000 1.5h6A.75.75 0 0012 8H6zm0 3a.75.75 0 000 1.5h6a.75.75 0 000-1.5H6zm0 3a.75.75 0 000 1.5h3a.75.75 0 000-1.5H6z" />
    </svg>
  );
}

function ApiIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clipRule="evenodd" />
    </svg>
  );
}

function NotesIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-1.47a.75.75 0 111.22-.872l2.25 3.15a.75.75 0 010 .872l-2.25 3.15a.75.75 0 11-1.22-.872l1.048-1.47H6.75A.75.75 0 016 10z" clipRule="evenodd" />
    </svg>
  );
}

function SettingsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}
