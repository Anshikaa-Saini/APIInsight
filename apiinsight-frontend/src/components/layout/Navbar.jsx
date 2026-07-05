import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
      <span className="text-lg font-semibold text-slate-900">APIInsight</span>

      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{user.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
