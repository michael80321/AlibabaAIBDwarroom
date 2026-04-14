import Link from 'next/link';
import PriorityBadge from './PriorityBadge';

interface CustomerCardProps {
  customer: {
    id: string;
    company_name: string;
    industry?: string | null;
    priority_label: string;
    priority_score: number;
    entry_points: string[];
    current_cloud?: string | null;
    why_now?: string | null;
    estimated_arr?: number | null;
    last_contacted?: Date | string | null;
  };
}

const CLOUD_ICONS: Record<string, string> = {
  AWS: '🟠',
  Azure: '🔵',
  GCP: '🟡',
  'multi': '🔀',
  unknown: '❓',
};

const ENTRY_POINT_COLORS: Record<string, string> = {
  AI: 'bg-purple-900/50 text-purple-300',
  GPU: 'bg-violet-900/50 text-violet-300',
  CDN: 'bg-blue-900/50 text-blue-300',
  Global: 'bg-green-900/50 text-green-300',
  China: 'bg-red-900/50 text-red-300',
  'China Access': 'bg-red-900/50 text-red-300',
  Cost: 'bg-yellow-900/50 text-yellow-300',
  SEA: 'bg-teal-900/50 text-teal-300',
};

function isNeglected(lastContacted: Date | string | null | undefined): boolean {
  if (!lastContacted) return true;
  const d = new Date(lastContacted);
  return Date.now() - d.getTime() > 7 * 24 * 60 * 60 * 1000;
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  const neglected = isNeglected(customer.last_contacted);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{CLOUD_ICONS[customer.current_cloud || 'unknown'] || '❓'}</span>
            <p className="text-white font-bold">{customer.company_name}</p>
            {neglected && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-900/50 text-orange-300">
                7天未聯
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs">{customer.industry}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <PriorityBadge label={customer.priority_label} />
          <div className="text-right">
            <span className="text-xs text-gray-500">評分 </span>
            <span className="text-sm font-bold text-white">{customer.priority_score}</span>
          </div>
        </div>
      </div>

      {/* Entry Points */}
      <div className="flex flex-wrap gap-1 mb-2">
        {customer.entry_points.slice(0, 3).map((ep) => (
          <span
            key={ep}
            className={`text-xs px-2 py-0.5 rounded-full ${ENTRY_POINT_COLORS[ep] || 'bg-gray-700 text-gray-300'}`}
          >
            {ep}
          </span>
        ))}
      </div>

      {/* Why Now */}
      {customer.why_now && (
        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{customer.why_now}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-800">
        {customer.estimated_arr ? (
          <span className="text-xs text-green-400">
            ${(customer.estimated_arr / 1000).toFixed(0)}K ARR
          </span>
        ) : (
          <span className="text-xs text-gray-600">未評估</span>
        )}
        <Link
          href={`/customers/${customer.id}`}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          查看詳情 →
        </Link>
      </div>
    </div>
  );
}
