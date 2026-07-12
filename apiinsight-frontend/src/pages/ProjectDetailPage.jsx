import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import EndpointList from '../components/endpoint/EndpointList';
import BaseUrlEditor from '../components/project/BaseUrlEditor';
import { getProjectApi } from '../api/projectApi';
import { listEndpointsApi } from '../api/endpointApi';
import { generateTestCasesForProjectApi } from '../api/testcaseApi';
import { executeProjectApi, updateBaseUrlApi } from '../api/executionApi';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateSummary, setGenerateSummary] = useState(null);
  const [generateError, setGenerateError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runSummary, setRunSummary] = useState(null);
  const [runError, setRunError] = useState('');

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

  async function handleGenerateAll() {
    setIsGenerating(true);
    setGenerateError('');
    setGenerateSummary(null);
    try {
      const res = await generateTestCasesForProjectApi(projectId);
      const results = res.data.results;
      const succeeded = results.filter((r) => r.status === 'success').length;
      setGenerateSummary({ succeeded, total: results.length, results });
    } catch (err) {
      setGenerateError(err.response?.data?.message || 'Test case generation failed');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRunAll() {
    setIsRunning(true);
    setRunError('');
    setRunSummary(null);
    try {
      const res = await executeProjectApi(projectId);
      const executions = res.data.executions;
      const passed = executions.filter((e) => e.passed).length;
      setRunSummary({ passed, total: executions.length });
    } catch (err) {
      setRunError(err.response?.data?.message || 'Test execution failed');
    } finally {
      setIsRunning(false);
    }
  }

  async function handleSaveBaseUrl(newBaseUrl) {
    const res = await updateBaseUrlApi(projectId, newBaseUrl);
    setProject(res.data.project);
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
              <Link
                to={`/projects/${projectId}/report`}
                className="ml-auto text-sm font-medium text-slate-600 hover:underline"
              >
                View Quality Report →
              </Link>
            </div>
            {project.version && (
              <p className="mt-1 text-sm text-slate-500">Version {project.version}</p>
            )}

            <BaseUrlEditor baseUrl={project.baseUrl} onSave={handleSaveBaseUrl} />

            <div className="flex items-center justify-between mt-8 mb-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Endpoints ({endpoints.length})
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={handleRunAll}
                  disabled={isRunning || endpoints.length === 0}
                  className="w-auto px-4 py-1.5"
                >
                  {isRunning ? 'Running all tests...' : 'Run All Tests'}
                </Button>
                <Button
                  onClick={handleGenerateAll}
                  disabled={isGenerating || endpoints.length === 0}
                  className="w-auto px-4 py-1.5"
                >
                  {isGenerating ? 'Generating for all endpoints...' : 'Generate Test Cases (All)'}
                </Button>
              </div>
            </div>

            {generateError && <p className="mb-3 text-sm text-red-600">{generateError}</p>}
            {generateSummary && (
              <p className="mb-3 text-sm text-slate-600">
                Generated test cases for {generateSummary.succeeded}/{generateSummary.total}{' '}
                endpoints.
                {generateSummary.succeeded < generateSummary.total &&
                  ' Open an endpoint that failed to see the error and retry it individually.'}
              </p>
            )}

            {runError && <p className="mb-3 text-sm text-red-600">{runError}</p>}
            {runSummary && (
              <p className="mb-3 text-sm text-slate-600">
                {runSummary.passed}/{runSummary.total} test cases passed. Open an endpoint to see
                individual results.
              </p>
            )}

            <EndpointList endpoints={endpoints} />
          </>
        )}
      </div>
    </div>
  );
}
