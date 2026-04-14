interface PriorityBadgeProps {
  label: string;
  size?: 'sm' | 'md';
}

const PRIORITY_STYLES: Record<string, string> = {
  'Attack Now': 'bg-red-500 text-white',
  Nurture: 'bg-orange-400 text-white',
  'Partner First': 'bg-yellow-400 text-gray-900',
  Monitor: 'bg-blue-400 text-white',
  Cold: 'bg-gray-400 text-white',
  Dead: 'bg-gray-200 text-gray-500',
};

export default function PriorityBadge({ label, size = 'sm' }: PriorityBadgeProps) {
  const style = PRIORITY_STYLES[label] || 'bg-gray-500 text-white';
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${style} ${sizeClass}`}>
      {label}
    </span>
  );
}
