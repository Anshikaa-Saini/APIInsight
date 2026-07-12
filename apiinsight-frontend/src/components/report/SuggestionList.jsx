export default function SuggestionList({ suggestions }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-lg">
      <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
        Developer Suggestions
      </h2>
      <ul className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <li key={index} className="flex gap-2 text-sm text-slate-700">
            <span className="text-slate-400">•</span>
            <span>{suggestion}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
