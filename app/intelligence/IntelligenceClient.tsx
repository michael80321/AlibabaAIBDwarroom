'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import Link from 'next/link';

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

interface CustomerSummary {
  id: string;
  company_name: string;
  current_cloud: string | null;
  priority_label: string;
  priority_score: number;
}

interface Props {
  statuses: (ServiceStatus | null)[];
  incidents: StatusIncident[];
  news: NewsItem[];
  partners: Partner[];
  customersByCloud: Record<string, CustomerSummary[]>;
}

// --- Derived BD angle from news metadata ---
function getBDAngle(item: NewsItem): string | null {
  const lowerTitle = item.title.toLowerCase();
  if (item.category === 'incident') {
    return `${item.vendor} 服務異常 → 立刻聯繫用 ${item.vendor} 的客戶，詢問是否有受到影響，提供 Alibaba Cloud 作為備援或遷移方案`;
  }
  if (item.category === 'promotion') {
    if (lowerTitle.includes('free') || lowerTitle.includes('免費')) {
      return `${item.vendor} 推出免費方案 → 準備比較分析，說明 Alibaba Cloud 的整體 TCO 優勢`;
    }
    return `${item.vendor} 降價 → 評估對 Alibaba 競爭力的影響，調整報價策略`;
  }
  if (item.category === 'product') {
    if (lowerTitle.includes('ai') || lowerTitle.includes('gpu')) {
      return `${item.vendor} 發布新 AI/GPU 功能 → 準備 Alibaba Cloud AI/PAI 平台對比材料給有 AI 需求的客戶`;
    }
    if (lowerTitle.includes('region') || lowerTitle.includes('asia') || lowerTitle.includes('apac')) {
      return `${item.vendor} 擴張亞太 Region → 了解新 Region 是否影響 Alibaba 在該地區的競爭優勢，更新差異化話術`;
    }
    return `${item.vendor} 推出新功能 → 研究是否有 Alibaba Cloud 對應方案，更新產品對比`;
  }
  if (lowerTitle.includes('china') || lowerTitle.includes('中國')) {
    return `中國市場動態 → 評估 Alibaba Cloud 中國合規優勢是否有機會切入`;
  }
  return null;
}

// Map vendor keywords to common customer.current_cloud values
const VENDOR_CLOUD_MAP: Record<string, string[]> = {
  AWS: ['AWS', 'Amazon', 'aws'],
  Azure: ['Azure', 'Microsoft Azure', 'azure'],
  GCP: ['GCP', 'Google Cloud', 'gcp'],
  Tencent: ['Tencent', 'Tencent Cloud', 'tencent'],
  Oracle: ['Oracle', 'OCI', 'oracle'],
  Huawei: ['Huawei', 'HWC', 'huawei'],
  Cloudflare: ['Cloudflare', 'cloudflare'],
};

function getAffectedCustomers(
  vendor: string,
  customersByCloud: Record<string, CustomerSummary[]>
): CustomerSummary[] {
  const aliases = VENDOR_CLOUD_MAP[vendor] || [vendor];
  const result: CustomerSummary[] = [];
  for (const [cloud, customers] of Object.entries(customersByCloud)) {
    if (aliases.some((a) => cloud.toLowerCase().includes(a.toLowerCase()))) {
      result.push(...customers);
    }
  }
  return result;
}

const COOPERATION_STYLES: Record<string, { label: string; class: string }> = {
  collaborate: { label: '合作中', class: 'text-green-400 bg-green-900/30' },
  conflict_risk: { label: '撞單風險', class: 'text-red-400 bg-red-900/30' },
  monitor: { label: '觀察中', class: 'text-gray-400 bg-gray-800' },
};

const CATEGORY_STYLES: Record<string, { bg: string; label: string }> = {
  incident: { bg: 'bg-red-900/50 text-red-300', label: '⚠ 事故' },
  product: { bg: 'bg-blue-900/50 text-blue-300', label: '📦 產品' },
  promotion: { bg: 'bg-green-900/50 text-green-300', label: '💸 促銷' },
  news: { bg: 'bg-gray-800 text-gray-300', label: '📰 新聞' },
};

const VENDOR_COLORS: Record<string, string> = {
  AWS: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
  Azure: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  GCP: 'bg-red-900/40 text-red-300 border-red-700/50',
  Cloudflare: 'bg-orange-900/40 text-orange-200 border-orange-700/50',
  Alibaba: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  Tencent: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
  Oracle: 'bg-red-900/40 text-red-200 border-red-700/50',
  Huawei: 'bg-red-900/30 text-red-300 border-red-800/50',
};

export default function IntelligenceClient({ statuses, incidents, news, partners, customersByCloud }: Props) {
  const [activeTab, setActiveTab] = useState<'radar' | 'status' | 'news' | 'partners'>('radar');
  const [vendorFilter, setVendorFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const vendors = useMemo(() => Array.from(new Set(news.map((n) => n.vendor))), [news]);

  const filteredNews = useMemo(() =>
    news.filter((n) => {
      if (vendorFilter && n.vendor !== vendorFilter) return false;
      if (categoryFilter && n.category !== categoryFilter) return false;
      return true;
    }),
    [news, vendorFilter, categoryFilter]
  );

  // Competitor opportunity radar: incidents + promotions in last 7 days
  const recentIncidents = useMemo(() =>
    incidents.filter((i) => {
      const age = Date.now() - new Date(i.started_at).getTime();
      return age < 7 * 24 * 60 * 60 * 1000;
    }),
    [incidents]
  );

  const opportunityNews = useMemo(() =>
    news.filter((n) => n.category === 'incident' || n.category === 'promotion').slice(0, 10),
    [news]
  );

  // Active incidents (unresolved)
  const activeIncidents = useMemo(() => incidents.filter((i) => !i.resolved_at), [incidents]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">🌐 市場情報</h1>
        {activeIncidents.length > 0 && (
          <div className="bg-red-950/40 border border-red-800 rounded-lg px-4 py-2 flex items-center gap-3">
            <span className="text-red-400 animate-pulse text-lg">🔴</span>
            <p className="text-red-300 text-sm font-medium">
              {activeIncidents.length} 個競品服務異常中 —— 立刻聯繫使用該雲的客戶！
            </p>
            <button onClick={() => setActiveTab('radar')} className="ml-auto text-xs text-red-400 underline">
              查看攻擊機會
            </button>
          </div>
        )}
        {activeIncidents.length === 0 && (
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg px-4 py-2">
            <p className="text-amber-300 text-sm">
              競品有異常時立刻切換到「競品機會雷達」—— 那是最好的切入時機
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'radar', label: '🎯 競品機會雷達' },
          { key: 'status', label: '⚡ 廠商即時狀態' },
          { key: 'news', label: '📰 市場新聞' },
          { key: 'partners', label: '🤝 已啟動夥伴' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-shrink-0 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.key === 'radar' && activeIncidents.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-xs">
                {activeIncidents.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: 競品機會雷達 */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          {/* Active incidents = hot opportunities */}
          {activeIncidents.length > 0 && (
            <div>
              <h2 className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2">
                <span className="animate-pulse">🔴</span> 進行中事故 — 現在打電話！
              </h2>
              <div className="space-y-3">
                {activeIncidents.map((incident) => {
                  const affected = getAffectedCustomers(incident.vendor, customersByCloud);
                  return (
                    <div key={incident.id} className="bg-red-950/20 border border-red-800/60 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${VENDOR_COLORS[incident.vendor] || 'bg-gray-800 text-gray-300 border-gray-700'}`}>
                              {incident.vendor}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${incident.severity === 'critical' ? 'bg-red-800 text-red-200' : 'bg-yellow-900/50 text-yellow-300'}`}>
                              {incident.severity === 'critical' ? '嚴重' : '警告'}
                            </span>
                          </div>
                          <p className="text-white font-medium text-sm">{incident.title}</p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            開始於 {format(new Date(incident.started_at), 'MM/dd HH:mm')}
                          </p>
                        </div>
                        <span className="text-red-400 text-xs bg-red-900/30 px-2 py-1 rounded">進行中</span>
                      </div>
                      {affected.length > 0 ? (
                        <div className="bg-gray-900/60 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-2 font-semibold">📞 立刻聯繫這些客戶：</p>
                          <div className="flex flex-wrap gap-2">
                            {affected.map((c) => (
                              <Link
                                key={c.id}
                                href={`/customers/${c.id}`}
                                className="text-xs px-2 py-1 rounded bg-orange-900/30 border border-orange-800/50 text-orange-300 hover:bg-orange-900/50 transition-colors"
                              >
                                {c.company_name}
                              </Link>
                            ))}
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            話術：「我看到 {incident.vendor} 今天有服務異常，你們有受到影響嗎？我們 Alibaba Cloud 可以提供緊急備援評估...」
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600">目前追蹤名單中無使用 {incident.vendor} 的客戶</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent resolved incidents (last 7 days) */}
          {recentIncidents.filter((i) => i.resolved_at).length > 0 && (
            <div>
              <h2 className="text-yellow-400 font-bold text-sm mb-3">⚡ 近期已恢復事故 — 跟進機會視窗</h2>
              <div className="space-y-2">
                {recentIncidents.filter((i) => i.resolved_at).slice(0, 5).map((incident) => {
                  const affected = getAffectedCustomers(incident.vendor, customersByCloud);
                  const durationMs = incident.resolved_at
                    ? new Date(incident.resolved_at).getTime() - new Date(incident.started_at).getTime()
                    : 0;
                  const durationH = Math.round(durationMs / 3600000);
                  return (
                    <div key={incident.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${VENDOR_COLORS[incident.vendor] || 'bg-gray-800 text-gray-300 border-gray-700'}`}>
                              {incident.vendor}
                            </span>
                            <span className="text-xs text-gray-500">
                              影響約 {durationH} 小時
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm">{incident.title}</p>
                        </div>
                        <span className="text-green-400 text-xs bg-green-900/20 px-2 py-1 rounded">已恢復</span>
                      </div>
                      {affected.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-xs text-gray-500">跟進客戶：</span>
                          {affected.map((c) => (
                            <Link
                              key={c.id}
                              href={`/customers/${c.id}`}
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              {c.company_name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Opportunity news: pricing changes, new regions */}
          {opportunityNews.length > 0 && (
            <div>
              <h2 className="text-blue-400 font-bold text-sm mb-3">📊 競品動態 — BD 機會分析</h2>
              <div className="space-y-2">
                {opportunityNews.map((item) => {
                  const angle = getBDAngle(item);
                  const affected = getAffectedCustomers(item.vendor, customersByCloud);
                  return (
                    <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${VENDOR_COLORS[item.vendor] || 'bg-gray-800 text-gray-300 border-gray-700'}`}>
                              {item.vendor}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${CATEGORY_STYLES[item.category]?.bg || ''}`}>
                              {CATEGORY_STYLES[item.category]?.label || item.category}
                            </span>
                            <span className="text-gray-600 text-xs">
                              {format(new Date(item.published_at), 'MM/dd')}
                            </span>
                          </div>
                          <p className="text-white text-sm mb-2">{item.title}</p>
                          {angle && (
                            <div className="bg-blue-950/30 border border-blue-800/40 rounded-md px-3 py-2">
                              <p className="text-blue-300 text-xs">💡 BD 角度：{angle}</p>
                              {affected.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  <span className="text-xs text-gray-500">相關客戶：</span>
                                  {affected.slice(0, 3).map((c) => (
                                    <Link
                                      key={c.id}
                                      href={`/customers/${c.id}`}
                                      className="text-xs text-blue-400 hover:text-blue-300"
                                    >
                                      {c.company_name}
                                    </Link>
                                  ))}
                                  {affected.length > 3 && (
                                    <span className="text-xs text-gray-600">+{affected.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          className="flex-shrink-0 text-xs text-gray-500 hover:text-gray-300">
                          原文↗
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeIncidents.length === 0 && recentIncidents.length === 0 && opportunityNews.length === 0 && (
            <div className="text-center py-16 text-gray-600">
              <p className="text-4xl mb-3">🕊</p>
              <p>目前無競品異常，市場平靜</p>
              <p className="text-xs mt-1">每 10 分鐘自動刷新競品狀態</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: 廠商即時狀態 */}
      {activeTab === 'status' && (
        <div>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {statuses.map((status, i) => {
              if (!status) return (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 opacity-50">
                  <p className="text-gray-600 text-sm">資料待更新</p>
                </div>
              );
              const affected = getAffectedCustomers(status.vendor, customersByCloud);
              return (
                <div key={status.id} className={`bg-gray-900 border rounded-xl p-4 ${
                  status.status !== 'operational' ? 'border-red-800' : 'border-gray-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${
                      status.status === 'operational' ? 'bg-green-400'
                      : status.status === 'degraded' ? 'bg-yellow-400 animate-pulse'
                      : 'bg-red-500 animate-pulse'
                    }`} />
                    <p className="text-white font-bold text-sm">{status.vendor}</p>
                  </div>
                  <p className={`text-sm font-medium mb-1 ${
                    status.status === 'operational' ? 'text-green-400'
                    : status.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {status.status === 'operational' ? '全部正常' :
                     status.status === 'degraded' ? '服務降級' : '服務中斷'}
                  </p>
                  {status.incident && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{status.incident}</p>
                  )}
                  <p className="text-gray-700 text-xs">
                    {format(new Date(status.checked_at), 'HH:mm')} 更新
                  </p>
                  {affected.length > 0 && status.status !== 'operational' && (
                    <div className="mt-2 pt-2 border-t border-gray-800">
                      <p className="text-xs text-red-400 mb-1">受影響客戶：</p>
                      {affected.slice(0, 2).map((c) => (
                        <Link key={c.id} href={`/customers/${c.id}`}
                          className="block text-xs text-orange-300 hover:text-orange-200 truncate">
                          → {c.company_name}
                        </Link>
                      ))}
                    </div>
                  )}
                  {affected.length > 0 && status.status === 'operational' && (
                    <p className="text-xs text-gray-700 mt-1">{affected.length} 個客戶使用此雲</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Incident History */}
          {incidents.length > 0 && (
            <div>
              <h3 className="text-white font-bold mb-3 text-sm">事件記錄（近 20 筆）</h3>
              <div className="space-y-2">
                {incidents.map((incident) => (
                  <div key={incident.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
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
            </div>
          )}

          {incidents.length === 0 && (
            <div className="text-center py-10 text-gray-600">近期無事故記錄</div>
          )}
        </div>
      )}

      {/* Tab: 市場新聞 */}
      {activeTab === 'news' && (
        <div>
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">所有廠商</option>
              {vendors.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <div className="flex gap-1">
              {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(categoryFilter === key ? '' : key)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    categoryFilter === key
                      ? style.bg.replace('/50', '/80')
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-gray-600 text-xs mb-3">共 {filteredNews.length} 筆</p>

          <div className="space-y-3">
            {filteredNews.map((item) => {
              const angle = getBDAngle(item);
              const affected = getAffectedCustomers(item.vendor, customersByCloud);
              return (
                <div key={item.id} className={`bg-gray-900 border rounded-xl p-4 ${
                  item.category === 'incident' ? 'border-red-900/60' : 'border-gray-800'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${VENDOR_COLORS[item.vendor] || 'bg-gray-800 text-gray-300 border-gray-700'}`}>
                          {item.vendor}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${CATEGORY_STYLES[item.category]?.bg || ''}`}>
                          {CATEGORY_STYLES[item.category]?.label || item.category}
                        </span>
                        <span className="text-yellow-400 text-xs">
                          {'★'.repeat(item.credibility)}{'☆'.repeat(3 - item.credibility)}
                        </span>
                      </div>
                      <p className="text-white font-medium text-sm mb-1">{item.title}</p>
                      {item.summary && (
                        <div className="mt-1 mb-2">
                          <span className="text-xs text-purple-400">✦ AI摘要：</span>
                          <p className="text-gray-400 text-xs mt-0.5">{item.summary}</p>
                        </div>
                      )}
                      {angle && (
                        <div className="bg-blue-950/30 border border-blue-800/40 rounded-md px-3 py-2 mb-2">
                          <p className="text-blue-300 text-xs">💡 {angle}</p>
                          {affected.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              <span className="text-xs text-gray-500">相關客戶：</span>
                              {affected.slice(0, 4).map((c) => (
                                <Link key={c.id} href={`/customers/${c.id}`}
                                  className="text-xs text-blue-400 hover:text-blue-300">
                                  {c.company_name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-gray-600 text-xs">
                        {format(new Date(item.published_at), 'MM/dd HH:mm')} · {item.source}
                      </p>
                    </div>
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 text-xs text-gray-500 hover:text-gray-300">原文↗</a>
                  </div>
                </div>
              );
            })}
            {filteredNews.length === 0 && (
              <div className="text-center py-12 text-gray-600">沒有符合條件的新聞</div>
            )}
          </div>
        </div>
      )}

      {/* Tab: 合作夥伴 */}
      {activeTab === 'partners' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-gray-500 text-xs">已啟動合作夥伴 {partners.length} 家</p>
            <Link href="/partners" className="text-xs text-blue-400 hover:text-blue-300">
              管理所有潛在夥伴 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {partners.map((partner) => {
              const style = COOPERATION_STYLES[partner.cooperation_type] || COOPERATION_STYLES.monitor;
              return (
                <div key={partner.id} className={`bg-gray-900 rounded-xl p-4 border ${
                  partner.cooperation_type === 'conflict_risk' ? 'border-red-800'
                  : partner.cooperation_type === 'collaborate' ? 'border-green-800'
                  : 'border-gray-800'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-bold">{partner.name}</p>
                      <p className="text-gray-500 text-xs">{partner.type} · {partner.regions.join('/')}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${style.class}`}>
                      {style.label}
                    </span>
                  </div>
                  {partner.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {partner.services.map((s) => (
                        <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {partner.cloud_alliances.length > 0 && (
                    <p className="text-xs text-gray-500">聯盟：{partner.cloud_alliances.join(', ')}</p>
                  )}
                  {partner.notes && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{partner.notes}</p>
                  )}
                </div>
              );
            })}
            {partners.length === 0 && (
              <div className="col-span-2 text-center py-10 text-gray-600">
                尚無已啟動夥伴，
                <Link href="/partners" className="text-blue-400 hover:text-blue-300">
                  前往推薦名單啟動合作
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
