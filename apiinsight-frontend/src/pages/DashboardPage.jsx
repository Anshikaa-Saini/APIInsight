import Navbar from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome, {user?.name}
        </h1>
        <p className="mt-2 text-slate-600">
          Your projects will show up here once spec upload is wired up (Milestone 2).
        </p>

        <div className="mt-8 p-8 border border-dashed border-slate-300 rounded-lg text-center text-slate-400">
          No projects yet
        </div>
      </div>
    </div>
  );
}
