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

const agentItems = [
  { href: '/interventions', label: '介入中心', icon: '🔔', badge: 'interventions' },
  { href: '/interventions/outreach', label: 'AI 草稿信', icon: '✉️', badge: 'outreach' },
  { href: '/agents', label: 'AI 員工中心', icon: '🤖', badge: null },
];

const adminItems = [
  { href: '/admin', label: '管理後台', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [badges, setBadges] = useState({ interventions: 0, outreach: 0 });

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }));

    // Fetch pending counts for badges
    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => {
        setBadges({
          interventions: data.summary?.pending_interventions ?? 0,
          outreach: data.summary?.pending_outreach ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  const getBadge = (badge: string | null) => {
    if (!badge) return 0;
    return badges[badge as keyof typeof badges] ?? 0;
  };

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
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} isActive={isActive} />
          );
        })}

        {/* AI Agents section */}
        <div className="pt-3 pb-1 px-3">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">AI 員工</p>
        </div>
        {agentItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const count = getBadge(item.badge);
          return (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              badge={count > 0 ? count : undefined}
            />
          );
        })}

        {/* Admin */}
        <div className="pt-3 pb-1 px-3">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">設定</p>
        </div>
        {adminItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} isActive={isActive} />
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

function NavLink({
  href,
  icon,
  label,
  isActive,
  badge,
}: {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
        isActive
          ? 'bg-gray-800 text-white border-l-[3px] border-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
      }`}
    >
      <span className="text-base shrink-0">{icon}</span>
      <span className={`flex-1 ${isActive ? 'font-semibold' : ''}`}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
          {badge}
        </span>
      )}
    </Link>
  );
}
