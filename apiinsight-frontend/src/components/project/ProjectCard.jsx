import { Link } from 'react-router-dom';
import Badge from '../common/Badge';

export default function ProjectCard({ project, onDelete }) {
  return (
    <div className="p-5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
      <div>
        <Link
          to={`/projects/${project._id}`}
          className="font-medium text-slate-900 hover:underline"
        >
          {project.name}
        </Link>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge>{project.sourceType}</Badge>
          <Badge>{project.status}</Badge>
          {project.status === 'parsed' && (
            <span className="text-xs text-slate-500">
              {project.endpointCount} endpoint{project.endpointCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
        {project.status === 'failed' && (
          <p className="mt-1.5 text-xs text-red-600">{project.failureReason}</p>
        )}
      </div>

      <button
        onClick={() => onDelete(project._id)}
        className="text-sm text-slate-400 hover:text-red-600"
      >
        Delete
      </button>
    </div>
  );
}
