import Badge from '../common/Badge';

const BAR_COLOR_BY_LEVEL = {
  Low: 'bg-green-500',
  Medium: 'bg-amber-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-500',
};

export default function RiskScoreGauge({ riskScore, riskLevel }) {
  const barColor = BAR_COLOR_BY_LEVEL[riskLevel] || 'bg-slate-400';

  return (
    <div className="p-6 bg-white border border-slate-200 rounded-lg">
      <div className="flex items-end gap-3">
        <span className="text-4xl font-semibold text-slate-900">{riskScore}</span>
        <span className="mb-1 text-sm text-slate-400">/ 100</span>
        <Badge>{riskLevel}</Badge>
      </div>

      <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${riskScore}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Higher is better — this reflects the share of test cases that passed, weighted by how
        severe a failure in each category is.
      </p>
    </div>
  );
}
