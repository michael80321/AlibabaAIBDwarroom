'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import VendorStatusBadge from '@/components/VendorStatusBadge';

interface ServiceStatus {
  id: string;
  vendor: string;
  status: string;
  incident?: string | null;
  checked_at: Date | string;
}

interface StatusIncident {
  id: string;
  vendor: string;
  severity: string;
  title: string;
  started_at: Date | string;
  resolved_at?: Date | string | null;
}

interface NewsItem {
  id: string;
  vendor: string;
  title: string;
  summary?: string | null;
  url: string;
  source: string;
  credibility: number;
  category: string;
  published_at: Date | string;
}

interface Partner {
  id: string;
  name: string;
  type: string;
  services: string[];
  regions: string[];
  cloud_alliances: string[];
  cooperation_type: string;
  notes?: string | null;
}

interface Props {
  statuses: (ServiceStatus | null)[];
  incidents: StatusIncident[];
  news: NewsItem[];
  partners: Partner[];
}

const COOPERATION_STYLES: Record<string, { label: string; class: string }> = {
  collaborate: { label: '合作', class: 'text-green-400 bg-green-900/30' },
  conflict_risk: { label: '撞單風險', class: 'text-red-400 bg-red-900/30' },
  monitor: { label: '觀察中', class: 'text-gray-400 bg-gray-800' },
};

const CATEGORY_STYLES: Record<string, string> = {
  incident: 'bg-red-900/50 text-red-300',
  product: 'bg-blue-900/50 text-blue-300',
  promotion: 'bg-green-900/50 text-green-300',
  news: 'bg-gray-800 text-gray-300',
};

export default function IntelligenceClient({ statuses: initialStatuses, incidents: initialIncidents, news: initialNews, partners }: Props) {
  const [activeTab, setActiveTab] = useState<'status' | 'news' | 'partners'>('status');
  const [vendorFilter, setVendorFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statuses, setStatuses] = useState(initialStatuses);
  const [incidents, setIncidents] = useState(initialIncidents);
  const [news, setNews] = useState(initialNews);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [refreshingNews, setRefreshingNews] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setRefreshingStatus(true);
    setRefreshMsg(null);
    try {
      const res = await fetch('/api/admin/check-status', { method: 'POST' });
      if (!res.ok) throw new Error();
      setRefreshMsg('廠商狀態已更新，請重新整理頁面查看最新資料');
    } catch {
      setRefreshMsg('更新失敗，請稍後再試');
    } finally {
      setRefreshingStatus(false);
    }
  };

  const handleRefreshNews = async () => {
    setRefreshingNews(true);
    setRefreshMsg(null);
    try {
      const res = await fetch('/api/admin/refresh-news', { method: 'POST' });
      if (!res.ok) throw new Error();
      setRefreshMsg('新聞抓取完成，請重新整理頁面查看最新資料');
    } catch {
      setRefreshMsg('抓取失敗，請稍後再試');
    } finally {
      setRefreshingNews(false);
    }
  };

  const filteredNews = news.filter((n) => {
    if (vendorFilter && n.vendor !== vendorFilter) return false;
    if (categoryFilter && n.category !== categoryFilter) return false;
    return true;
  });

  const vendors = Array.from(new Set(news.map((n) => n.vendor)));

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">🌐 市場情報</h1>
          <div className="flex gap-2">
            <button
              onClick={handleCheckStatus}
              disabled={refreshingStatus}
              className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs disabled:opacity-50 transition-colors"
            >
              {refreshingStatus ? '檢查中...' : '🔄 檢查廠商狀態'}
            </button>
            <button
              onClick={handleRefreshNews}
              disabled={refreshingNews}
              className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs disabled:opacity-50 transition-colors"
            >
              {refreshingNews ? '抓取中...' : '📰 手動更新新聞'}
            </button>
          </div>
        </div>
        {refreshMsg && (
          <p className="text-green-400 text-xs mb-2">{refreshMsg}</p>
        )}
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg px-4 py-2">
          <p className="text-amber-300 text-sm">
            關注競品異常：有中斷或降級時，立即聯繫使用該雲的客戶
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'status', label: '雲廠商狀態' },
          { key: 'news', label: '市場新聞' },
          { key: 'partners', label: '合作夥伴' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Vendor Status */}
      {activeTab === 'status' && (
        <div>
          {incidents.filter((i) => !i.resolved_at).length > 0 && (
            <div className="mb-4 p-4 bg-red-950/30 border border-red-800 rounded-xl">
              <p className="text-red-400 font-bold text-sm mb-2">🔴 目前有異常事件</p>
              {incidents
                .filter((i) => !i.resolved_at)
                .map((i) => (
                  <div key={i.id} className="text-sm text-red-300">
                    [{i.vendor}] {i.title}
                  </div>
                ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            {statuses.filter(Boolean).map((status) => {
              if (!status) return null;
              return (
                <div
                  key={status.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        status.status === 'operational'
                          ? 'bg-green-400'
                          : status.status === 'degraded'
                          ? 'bg-yellow-400 animate-pulse'
                          : 'bg-red-500 animate-pulse'
                      }`}
                    />
                    <p className="text-white font-bold">{status.vendor}</p>
                  </div>
                  <p className={`text-sm font-medium ${
                    status.status === 'operational' ? 'text-green-400' :
                    status.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {status.status === 'operational' ? '全部正常' :
                     status.status === 'degraded' ? '服務降級' : '服務中斷'}
                  </p>
                  {status.incident && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{status.incident}</p>
                  )}
                  <p className="text-gray-700 text-xs mt-2">
                    {format(new Date(status.checked_at), 'HH:mm', { locale: zhTW })} 更新
                  </p>
                </div>
              );
            })}
          </div>

          {/* Incident History */}
          <div className="mt-6">
            <h3 className="text-white font-bold mb-3">事件記錄</h3>
            {incidents.length > 0 ? (
              <div className="space-y-2">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span>{incident.resolved_at ? '🟢' : incident.severity === 'critical' ? '🔴' : '🟡'}</span>
                      <div>
                        <p className="text-sm text-white">[{incident.vendor}] {incident.title}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(incident.started_at), 'MM/dd HH:mm')}
                          {incident.resolved_at && ` → ${format(new Date(incident.resolved_at), 'HH:mm')} 恢復`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      incident.resolved_at ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                    }`}>
                      {incident.resolved_at ? '已恢復' : '進行中'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
                <p className="text-green-400 text-sm font-medium mb-1">✓ 近期無事故紀錄</p>
                <p className="text-gray-600 text-xs">點「檢查廠商狀態」可即時更新</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: News */}
      {activeTab === 'news' && (
        <div>
          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">所有廠商</option>
              {vendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">所有類型</option>
              <option value="news">新聞</option>
              <option value="product">產品</option>
              <option value="promotion">促銷</option>
              <option value="incident">事件</option>
            </select>
          </div>

          {filteredNews.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-500 text-sm mb-1">尚無新聞資料</p>
              <p className="text-gray-700 text-xs">點右上角「手動更新新聞」立即抓取</p>
            </div>
          )}
          <div className="space-y-3">
            {filteredNews.map((item) => (
              <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                        {item.vendor}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${CATEGORY_STYLES[item.category] || 'bg-gray-800 text-gray-400'}`}>
                        {item.category}
                      </span>
                      {/* Credibility stars */}
                      <span className="text-yellow-400 text-xs">
                        {'★'.repeat(item.credibility)}{'☆'.repeat(3 - item.credibility)}
                      </span>
                    </div>
                    <p className="text-white font-medium text-sm mb-1">{item.title}</p>
                    {item.summary && (
                      <div className="mt-1">
                        <span className="text-xs text-purple-400">✦ AI 摘要：</span>
                        <p className="text-gray-400 text-xs mt-0.5">{item.summary}</p>
                      </div>
                    )}
                    <p className="text-gray-600 text-xs mt-2">
                      {format(new Date(item.published_at), 'MM/dd HH:mm')} · {item.source}
                    </p>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-xs text-blue-400 hover:text-blue-300"
                  >
                    原文 ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Partners */}
      {activeTab === 'partners' && (
        <div className="grid grid-cols-2 gap-4">
          {partners.map((partner) => {
            const style = COOPERATION_STYLES[partner.cooperation_type] || COOPERATION_STYLES.monitor;
            return (
              <div
                key={partner.id}
                className={`bg-gray-900 rounded-xl p-4 border ${
                  partner.cooperation_type === 'conflict_risk'
                    ? 'border-red-800'
                    : partner.cooperation_type === 'collaborate'
                    ? 'border-green-800'
                    : 'border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-bold">{partner.name}</p>
                    <p className="text-gray-500 text-xs">{partner.type}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${style.class}`}>
                    {style.label}
                  </span>
                </div>

                {partner.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {partner.services.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {partner.cloud_alliances.length > 0 && (
                  <p className="text-xs text-gray-500">
                    雲端聯盟：{partner.cloud_alliances.join(', ')}
                  </p>
                )}

                {partner.notes && (
                  <p className="text-xs text-gray-400 mt-2">{partner.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
