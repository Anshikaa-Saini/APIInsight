const COLOR_MAP = {
  // HTTP methods
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PUT: 'bg-amber-100 text-amber-700',
  PATCH: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  // Project status
  parsed: 'bg-green-100 text-green-700',
  processing: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
};

const DEFAULT_COLOR = 'bg-slate-100 text-slate-700';

export default function Badge({ children }) {
  const colorClasses = COLOR_MAP[children] || DEFAULT_COLOR;

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${colorClasses}`}
    >
      {children}
    </span>
  );
}
