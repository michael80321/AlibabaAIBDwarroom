interface VendorStatusBadgeProps {
  vendor: string;
  status: string;
  checkedAt?: string | Date | null;
}

export default function VendorStatusBadge({ vendor, status, checkedAt }: VendorStatusBadgeProps) {
  const dotClass =
    status === 'operational'
      ? 'bg-green-400'
      : status === 'degraded'
      ? 'bg-yellow-400 animate-pulse'
      : 'bg-red-500 animate-pulse';

  const labelClass =
    status === 'operational'
      ? 'text-green-400'
      : status === 'degraded'
      ? 'text-yellow-400'
      : 'text-red-400';

  const statusLabel =
    status === 'operational' ? '正常' : status === 'degraded' ? '降級' : '中斷';

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${dotClass} inline-block`} />
        <span className="text-sm text-gray-300">{vendor}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium ${labelClass}`}>{statusLabel}</span>
        {checkedAt && (
          <span className="text-xs text-gray-600">
            {new Date(checkedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
