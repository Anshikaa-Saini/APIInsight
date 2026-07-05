import { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import UploadSpecForm from '../components/project/UploadSpecForm';
import ProjectCard from '../components/project/ProjectCard';
import { useAuth } from '../hooks/useAuth';
import { listProjectsApi, deleteProjectApi } from '../api/projectApi';

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setIsLoading(true);
    try {
      const res = await listProjectsApi();
      setProjects(res.data.projects);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load projects');
    } finally {
      setIsLoading(false);
    }
  }

  function handleUploaded(newProject) {
    setProjects([newProject, ...projects]);
  }

  async function handleDelete(projectId) {
    const previousProjects = projects;
    setProjects(projects.filter((p) => p._id !== projectId)); // optimistic update
    try {
      await deleteProjectApi(projectId);
    } catch (err) {
      setProjects(previousProjects); // revert on failure
      setError(err.response?.data?.message || 'Could not delete project');
    }
  }

  return (
    <div>
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user?.name}</h1>
        <p className="mt-2 text-slate-600">
          Upload a Swagger/OpenAPI spec to get started.
        </p>

        <div className="mt-6">
          <UploadSpecForm onUploaded={handleUploaded} />
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <h2 className="mt-10 mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Your Projects
        </h2>

        {isLoading ? (
          <p className="text-slate-400">Loading...</p>
        ) : projects.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-300 rounded-lg text-center text-slate-400">
            No projects yet
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
