interface AlertBannerProps {
  vendor: string;
  title: string;
  severity: 'warning' | 'critical';
}

export default function AlertBanner({ vendor, title, severity }: AlertBannerProps) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${
        severity === 'critical'
          ? 'bg-red-950/50 border-red-700 text-red-300'
          : 'bg-yellow-950/50 border-yellow-700 text-yellow-300'
      }`}
    >
      <span className="text-lg mt-0.5">{severity === 'critical' ? '🔴' : '🟡'}</span>
      <div>
        <p className="text-xs font-bold">{vendor}</p>
        <p className="text-xs">{title}</p>
      </div>
    </div>
  );
}
