'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/', label: '今日作戰指令', icon: '⚔️' },
  { href: '/prospects', label: '潛在客戶', icon: '🎯' },
  { href: '/partners', label: '合作夥伴', icon: '🤝' },
  { href: '/pipeline', label: 'Pipeline 看板', icon: '📊' },
  { href: '/intelligence', label: '市場情報', icon: '🌐' },
  { href: '/strategy', label: '策略中心', icon: '🧠' },
  { href: '/meetings', label: '會議 AI 整理', icon: '📝' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }));
  }, []);

  return (
    <aside
      className="flex flex-col w-56 min-h-screen"
      style={{ backgroundColor: '#0F1117' }}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-orange-400 text-xl">☁️</span>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Alibaba Cloud</p>
            <p className="text-orange-400 text-xs font-semibold tracking-wider">BD WAR ROOM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-gray-800 text-white border-l-[3px] border-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-gray-600 text-xs">最後更新</p>
        <p className="text-gray-400 text-xs">{lastUpdated || '--:--'}</p>
      </div>
    </aside>
  );
}
