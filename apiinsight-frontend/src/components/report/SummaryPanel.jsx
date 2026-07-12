export default function SummaryPanel({ summary }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-lg">
      <h2 className="mb-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
        AI Summary
      </h2>
      <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
    </div>
  );
}
