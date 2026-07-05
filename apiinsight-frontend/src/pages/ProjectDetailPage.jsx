import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Badge from '../components/common/Badge';
import EndpointList from '../components/endpoint/EndpointList';
import { getProjectApi } from '../api/projectApi';
import { listEndpointsApi } from '../api/endpointApi';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [projectId]);

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const [projectRes, endpointsRes] = await Promise.all([
        getProjectApi(projectId),
        listEndpointsApi(projectId),
      ]);
      setProject(projectRes.data.project);
      setEndpoints(endpointsRes.data.endpoints);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load project');
    } finally {
      setIsLoading(false);
    }
  }

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
              <h1 className="text-2xl font-semibold text-slate-900">{project.name}</h1>
              <Badge>{project.status}</Badge>
            </div>
            {project.version && (
              <p className="mt-1 text-sm text-slate-500">Version {project.version}</p>
            )}

            <h2 className="mt-8 mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Endpoints ({endpoints.length})
            </h2>
            <EndpointList endpoints={endpoints} />
          </>
        )}
      </div>
    </div>
  );
}
