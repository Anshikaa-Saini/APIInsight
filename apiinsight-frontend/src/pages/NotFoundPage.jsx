import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-3xl font-semibold text-slate-900">404</h1>
      <p className="mt-2 text-slate-600">Page not found</p>
      <Link to="/dashboard" className="mt-4 text-sm font-medium text-slate-900 hover:underline">
        Go to dashboard
      </Link>
    </div>
  );
}
