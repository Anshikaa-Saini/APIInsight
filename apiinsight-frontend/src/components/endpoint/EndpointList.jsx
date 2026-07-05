import { Link } from 'react-router-dom';
import Badge from '../common/Badge';

export default function EndpointList({ endpoints }) {
  if (endpoints.length === 0) {
    return (
      <div className="p-8 border border-dashed border-slate-300 rounded-lg text-center text-slate-400">
        No endpoints found in this spec
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
      {endpoints.map((endpoint) => (
        <Link
          key={endpoint._id}
          to={`/endpoints/${endpoint._id}`}
          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
        >
          <Badge>{endpoint.method}</Badge>
          <span className="font-mono text-sm text-slate-800">{endpoint.path}</span>
          {endpoint.summary && (
            <span className="text-sm text-slate-500 truncate">— {endpoint.summary}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
