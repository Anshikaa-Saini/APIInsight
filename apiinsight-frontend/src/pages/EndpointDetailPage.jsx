import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Badge from '../components/common/Badge';
import { getEndpointApi } from '../api/endpointApi';

export default function EndpointDetailPage() {
  const { endpointId } = useParams();
  const [endpoint, setEndpoint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getEndpointApi(endpointId)
      .then((res) => setEndpoint(res.data.endpoint))
      .catch((err) => setError(err.response?.data?.message || 'Could not load endpoint'))
      .finally(() => setIsLoading(false));
  }, [endpointId]);

  return (
    <div>
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/dashboard" className="text-sm text-slate-500 hover:underline">
          ← Back to dashboard
        </Link>

        {isLoading ? (
          <p className="mt-6 text-slate-400">Loading...</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : (
          <>
            <div className="flex items-center gap-3 mt-4">
              <Badge>{endpoint.method}</Badge>
              <h1 className="font-mono text-xl text-slate-900">{endpoint.path}</h1>
            </div>
            {endpoint.summary && <p className="mt-2 text-slate-600">{endpoint.summary}</p>}

            <Section title="Parameters">
              {endpoint.parameters.length === 0 ? (
                <EmptyNote>No parameters</EmptyNote>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 pr-4 font-medium">In</th>
                      <th className="py-2 pr-4 font-medium">Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.parameters.map((param) => (
                      <tr key={param.name} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pr-4 font-mono">{param.name}</td>
                        <td className="py-2 pr-4">{param.in}</td>
                        <td className="py-2 pr-4">{param.required ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            <Section title="Request Body Schema">
              {Object.keys(endpoint.requestBodySchema || {}).length === 0 ? (
                <EmptyNote>No request body</EmptyNote>
              ) : (
                <JsonBlock data={endpoint.requestBodySchema} />
              )}
            </Section>

            <Section title="Responses">
              {Object.keys(endpoint.responses || {}).length === 0 ? (
                <EmptyNote>No responses defined</EmptyNote>
              ) : (
                <JsonBlock data={endpoint.responses} />
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </div>
  );
}

function EmptyNote({ children }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}

function JsonBlock({ data }) {
  return (
    <pre className="p-4 overflow-x-auto text-xs bg-slate-900 text-slate-100 rounded-lg">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
